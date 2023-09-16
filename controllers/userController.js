const admin = require('firebase-admin');
const User = require('../models/User');
const Kundli = require('../models/Kundli');
const { db } = require('../services/firebaseService')
const twilio = require('twilio');
const client = twilio('AC4ce239507372074ab681f665c4c00da1', '9cb8de69c51a9779608785e4e622a4c4');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay')

const paymentInstance = new Razorpay({
    key_id: 'rzp_live_nPUDcHhI7fS8Z3',
    key_secret: 'IHM1hApWkRij7hQJz4sZcafe'
})

exports.addAmount = async (req, res) => {
    try {
        const { amount } = req.body;
        // const authHeader = req.headers['authorization'];

        // if (!authHeader) {
        //     return res.status(401).json({ error: 'Unauthorized' });
        // }

        // const token = authHeader.split(' ')[1];

        // const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        // let uid = decodedToken.uid;

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `reciept#1`,
        };

        paymentInstance.orders.create(options, async (err, order) => {
            if (!err) {
                // const userRef = db.collection('users').doc(uid);
                // const userDoc = await userRef.get();

                // if (!userDoc.exists) {
                //     return res.status(404).json({ error: 'User not found', status: false });
                // }

                // let data = userDoc.data()
                // var updatedData = {}

                // if (data[wallet] !== undefined) {
                //     updatedData = {
                //         ...data,
                //         wallet: {
                //             balance: parseInt(data.wallet.balance) + parseInt(order.amount)
                //         }
                //     };

                // } else {
                //     updatedData = {
                //         ...data,
                //         wallet: {
                //             balance: order.amount
                //         }
                //     };
                // }

                // await userRef.update(updatedData);
                res.status(200).json({ message: 'Transaction successful', status: true });
            } else {
                res.status(200).json({ message: 'Transaction failed', status: false });
            }
        })


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Transaction failed', status: false });
    }
};

exports.spendAmount = async (req, res) => {
    try {
        const { amount } = req.body;
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        let uid = decodedToken.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        let data = userDoc.data()
        var updatedData = {}

        if (data[wallet] !== undefined) {
            updatedData = {
                ...data,
                wallet: {
                    balance: parseInt(data.wallet.balance) - parseInt(order.amount)
                }
            };

        } else {
            res.status(200).json({ message: 'Not enough balance in your wallet', status: false });
        }

        await userRef.update(updatedData);
        res.status(200).json({ message: 'Payment successful', status: true });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Payment failed', status: false });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required.', status: false });
        }

        await client.verify.v2.services('VA3fd85fb82579223df03ee53ef7adc2bc')
            .verifications.create({
                to: phoneNumber,
                channel: "sms",
                locale: "en"
            });

        res.status(200).json({ message: 'OTP sent successfully', status: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send OTP', status: false });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        var uid = null;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required.', status: false });
        }

        const verificationCheck = await client.verify.v2.services('VA3fd85fb82579223df03ee53ef7adc2bc').verificationChecks.create({
            to: phoneNumber,
            code: otp
        });

        
        if (verificationCheck.status === 'approved') {
            await db.collection('users')
                .where('phoneNumber', '==', phoneNumber)
                .where('type', '==', 'user')
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        let userDetails = {
                            phoneNumber: phoneNumber
                        }

                        let data = {
                            ...userDetails,
                            type: 'user'
                        }

                        const newUser = new User(data);
                        const userData = {
                            ...newUser.userDetails
                        };

                        const newDocRef = db.collection('users').add(userData);
                        uid = newDocRef.id;

                        let tokenPayload = {
                            uid: uid
                        }

                        const token = jwt.sign(tokenPayload, "Secret!@#Key", { algorithm: 'HS256' });

                        res.status(200).json({ message: 'Registration successful', token: token, status: true });
                    } else {
                        uid = querySnapshot.docs[0].id;

                        let tokenPayload = {
                            uid: uid
                        }

                        const token = jwt.sign(tokenPayload, "Secret!@#Key", { algorithm: 'HS256' });

                        res.status(200).json({ message: 'Login successful', token: token, status: true });
                    }
                })
                .catch((error) => {
                    console.log(error)
                    res.status(404).json({ error: 'Failed to send OTP', status: false });
                });
        } else {
            res.status(400).json({ message: 'Wrong OTP', status: false });
        }

    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed', details: error.message, status: false });
    }
};

exports.editUserProfile = async (req, res) => {
    try {
        const updatedData = req.body;
        const allowedKeys = [
            'name',
            'phoneNumber',
            'age',
            'gender',
            'dateOfBirth',
            'timeOfBirth',
            'placeOfBirth',
            'address',
            'city',
            'pincode'
        ];

        const filteredData = Object.keys(updatedData)
            .filter(key => allowedKeys.includes(key))
            .reduce((obj, key) => {
                obj[key] = updatedData[key];
                return obj;
            }, {});

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        let uid = decodedToken.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        const data = {
            ...userDoc.data(),
            ...filteredData
        };

        await userRef.update(data);

        res.status(201).json({ message: 'User Profile Updated Successfully', status: true });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ error: 'User Profile Update Failed', status: false });
    }
};

exports.saveKundli = async (req, res) => {
    try {
        const { name, gender, dateOfBirth, timeOfBirth, placeOfBirth } = req.body;
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        let uid = decodedToken.uid;

        const existingKundli = await db.collection('kundli')
            .where('id', '==', uid)
            .where('name', '==', name)
            .where('gender', '==', gender)
            .where('dateOfBirth', '==', dateOfBirth)
            .where('timeOfBirth', '==', timeOfBirth)
            .where('placeOfBirth', '==', placeOfBirth)
            .get();

        if (!existingKundli.empty) {
            return res.status(400).json({ error: 'Kundli already exists', status: false });
        }

        const kundliData = {
            id: uid,
            name: name,
            gender: gender,
            dateOfBirth: dateOfBirth,
            timeOfBirth: timeOfBirth,
            placeOfBirth: placeOfBirth
        };

        await db.collection('kundli').add(kundliData);
        res.status(201).json({ message: 'Kundli Saved Successfully', status: true });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ error: 'Kundli Saving Failed', status: false });
    }
};

exports.fetchKundli = async (req, res) => {
    try {
        const kundliRef = db.collection('kundli');

        const snapshot = await kundliRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'No Kundli data found for the user', status: false });
        }

        const kundli = [];

        snapshot.forEach((doc) => {
            kundli.push({
                id: doc.id,
                data: doc.data(),
            });
        });

        res.status(200).json({ message: "Data fetched successfully", kundliData: kundli, status: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch Kundli data', status: false });
    }
};

exports.getAstrologers = async (req, res) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef
            .where('type', '==', 'astrologer')
            .where('status', '==', 'live')
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'No live astrologers found', status: false });
        }

        const users = [];

        snapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        res.status(200).json({ message: "Live astrologers fetched successfully", users, status: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Fetching live astrologers failed', status: false });
    }
};

exports.getUser = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, 'Secret!@#Key', { algorithm: 'HS256' });
        const uid = decodedToken.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        const userData = userDoc.data();

        res.status(200).json({ user: userData, status: true });
    } catch (error) {
        res.status(500).json({ error: 'Fetching User details failed', status: false });
    }
};

exports.getAstrologerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required', status: false });
        }

        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Astrologer not found', status: false });
        }

        const userData = userDoc.data();

        res.status(200).json({ message: 'Astrologer details fetched successfully', user: userData, status: true });
    } catch (error) {
        res.status(500).json({ error: 'Fetching astrologer details failed', status: false });
    }
};

exports.consultationForm = async (req, res) => {
    try {
        const { name,
            gender,
            dateOfBirth,
            timeOfBirth,
            placeOfBirth,
            maritalStatus,
            occupation,
            concern } = req.body;

            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
    
            const token = authHeader.split(' ')[1];
    
            const decodedToken = jwt.verify(token, 'Secret!@#Key', { algorithm: 'HS256' });
            const uid = decodedToken.uid;

            console.log(uid, 'uuuuuuu');

            const consultationData = {
                id: uid,
                name: name,
                gender: gender,
                dateOfBirth: dateOfBirth,
                timeOfBirth: timeOfBirth,
                placeOfBirth: placeOfBirth,
                maritalStatus: maritalStatus,
                occupation: occupation,
                concern: concern
            };

            await db.collection('consultations').add(consultationData);

            res.status(200).json({ message: 'Consultation saved successful', status: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Consultaion booking failed', status: false });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        const file = req.file;

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized', status: false });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        let uid = decodedToken.uid;

        if (!file) {
            return res.status(400).json({ error: 'Image is required', status: false });
        }

        const filename = Date.now() + file.originalname;
        const fileUpload = bucket.file(filename);
        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        stream.on('error', (error) => {
            console.error(error);
            return res.status(500).send('Error uploading file.');
        });

        stream.on('finish', async () => {
            const [url] = await fileUpload.getSignedUrl({
                action: 'read',
                expires: '03-01-2500',
            });

            const userRef = admin.firestore().collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(200).json({ error: 'User not found', status: false });
            }

            await userRef.update({ ...userDoc.data(), image: url });

            res.status(200).json({ message: 'Consultation saved successful', image: url, status: true });
        });

        stream.end(file.buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.', status: false });
    }
};