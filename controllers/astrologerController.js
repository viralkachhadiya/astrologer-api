const admin = require('firebase-admin');
const User = require('../models/User');
const { db, bucket } = require('../services/firebaseService')
const twilio = require('twilio');
const client = twilio('AC4ce239507372074ab681f665c4c00da1', '9cb8de69c51a9779608785e4e622a4c4');
const jwt = require('jsonwebtoken');

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
        res.status(500).json({ error: 'Failed to send OTP', status: false });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required.', status: false });
        }

        const verificationCheck = await client.verify.v2.services('VA3fd85fb82579223df03ee53ef7adc2bc').verificationChecks.create({
            to: phoneNumber,
            code: otp
        });

        if (verificationCheck.status === 'approved') {
            res.status(200).json({ message: 'Verification successful', status: true });
        } else {
            res.status(400).json({ message: 'Wrong OTP', status: false });
        }

    } catch (error) {
        res.status(500).json({ error: 'Verification failed', details: error.message, status: false });
    }
};

exports.registerAstrologer = async (req, res) => {
    try {
        const { name,
            phoneNumber,
            email,
            dateOfBirth,
            gender,
            presentAddress,
            permanantAddress,
            emergencyNumber,
            maritalStatus,
            astrologerType,
            consultationType,
            experience,
            qualification,
            degree,
            college,
            learningPlace,
            language,
            reference,
            isWorking,
            platformName,
            hoursToContribute,
            whyOnboard,
            internationalTravel,
            foreignClient,
            clientHandling,
            bestQuality,
            expectedEarning,
            aboutYourself,
            instagram,
            facebook,
            youtube,
            otherLinks,
            interviewDate,
            interviewTime,
            uid } = req.body;

        if (!uid) {

            await db.collection('users')
                .where('phoneNumber', '==', phoneNumber)
                .where('type', '==', 'astrologer')
                .get()
                .then(async (querySnapshot) => {
                    if (querySnapshot.empty) {
                        const updatedData = {
                            name: name,
                            phoneNumber: phoneNumber,
                            email: email,
                            type: 'astrologer',
                            status: 'pending'
                        };

                        const userRef = await db.collection('users').add(updatedData)

                        let uid = userRef.id;

                        res.status(200).json({ message: 'Registration successful', uid: uid, status: true });
                    } else {
                        res.status(200).json({ message: 'Phone number already registered', status: false });
                    }
                })

                .catch((error) => {
                    console.log(error)
                    res.status(404).json({ error: 'An error occured', status: false });
                });
        } else {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User not found', status: false });
            }

            const updatedData = {
                ...userDoc.data(),
                dateOfBirth: dateOfBirth,
                gender: gender,
                presentAddress: presentAddress,
                permanantAddress: permanantAddress,
                emergencyNumber: emergencyNumber,
                maritalStatus: maritalStatus,
                astrologerType: astrologerType,
                consultationType: consultationType,
                experience: experience,
                qualification: qualification,
                degree: degree,
                college: college,
                learningPlace: learningPlace,
                language: language,
                reference: reference,
                isWorking: isWorking,
                platformName: platformName,
                hoursToContribute: hoursToContribute,
                whyOnboard: whyOnboard,
                internationalTravel: internationalTravel,
                foreignClient: foreignClient,
                clientHandling: clientHandling,
                bestQuality: bestQuality,
                expectedEarning: expectedEarning,
                aboutYourself: aboutYourself,
                instagram: instagram,
                facebook: facebook,
                youtube: youtube,
                otherLinks: otherLinks,
                interviewDate: interviewDate,
                interviewTime: interviewTime,
                status: 'under-review'
            };

            await userRef.update(updatedData);

            res.status(200).json({ message: 'Registration successful', status: true });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Registration failed', status: false });
    }
};

exports.viewProfile = async (req, res) => {
    try {
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
            ...userDoc.data()
        };

        res.status(200).json({ message: 'Profile fetched successfully.', profile: data, status: true });
    } catch (error) {
        res.status(500).json({ error: 'Fetching profile failed', status: false });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedData = req.body;
        const allowedKeys = [
            'name',
            'phoneNumber',
            'emergencyPhoneNumber',
            'emergencyPerson',
            'emergencyRelation',
            'dateOfBirth',
            'gender',
            'presentAddress',
            'permanantAddress',
            'emergencyNumber',
            'maritalStatus',
            'astrologerType',
            'consultationType',
            'experience',
            'qualification',
            'degree',
            'college',
            'learningPlace',
            'language',
            'reference',
            'isWorking',
            'platformName',
            'hoursToContribute',
            'whyOnboard',
            'internationalTravel',
            'foreignClient',
            'clientHandling',
            'bestQuality',
            'expectedEarning',
            'aboutYourself',
            'instagram',
            'facebook',
            'youtube',
            'otherLinks'
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

        const newData = {
            ...userDoc.data(),
            ...filteredData
        };

        await userRef.update(newData);
        res.status(200).json({ message: 'Profile updated successfully.', status: true });
    } catch (error) {
        res.status(500).json({ error: 'Updating profile failed', status: false });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
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

        const updatedData = {
            ...userDoc.data(),
            password: password
        };

        await userRef.update(updatedData);

        res.status(200).json({ message: 'Password updated successfully.', status: true });
    } catch (error) {
        res.status(500).json({ error: 'Password update failed.', status: false });
    }
};

exports.login = async (req, res) => {
    try {
        const { phoneNumber, password, otp } = req.body;
        let uid = null;

        if (!password) {
            await db.collection('users')
                .where('phoneNumber', '==', phoneNumber)
                .where('type', '==', 'astrologer')
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        res.status(200).json({ error: 'User not found', status: false });
                    } else {
                        uid = querySnapshot.docs[0].id;
                    }
                })
                .catch((error) => {
                    res.status(404).json({ error: 'Can not find user', status: false });
                });

            if (!phoneNumber || !otp) {
                return res.status(400).json({ error: 'Phone number and OTP are required.', status: false });
            }

            const verificationCheck = await client.verify.v2.services('VA3fd85fb82579223df03ee53ef7adc2bc').verificationChecks.create({
                to: phoneNumber,
                code: otp
            });

            if (verificationCheck.status === 'approved') {

                let tokenPayload = {
                    uid: uid
                }

                const token = jwt.sign(tokenPayload, "Secret!@#Key", { algorithm: 'HS256' });
                res.status(200).json({ message: 'Login successful', token: token, status: true });
            } else {
                res.status(400).json({ message: 'Wrong OTP', status: false });
            }
        }

        if (!phoneNumber || !password) {
            return res.status(400).json({ error: 'Phone number and Password are required.', status: false });
        }

        await db.collection('users')
            .where('phoneNumber', '==', phoneNumber)
            .get()
            .then(async (querySnapshot) => {
                if (querySnapshot.empty) {
                    res.status(200).json({ message: 'User not found', status: false });
                } else {
                    if (password === querySnapshot.docs[0].data().password) {
                        uid = querySnapshot.docs[0].id;

                        let tokenPayload = {
                            uid: uid
                        }

                        const token = jwt.sign(tokenPayload, "Secret!@#Key", { algorithm: 'HS256' });

                        res.status(200).json({ message: 'Login Successful', token: token, status: true });
                    }
                    else {
                        res.status(200).json({ message: 'Incorrect Password', s0t0atus: false });
                    }
                }
            })
    } catch (error) {
        res.status(500).json({ error: 'Login failed', status: false });
    }
};

exports.fetchTimeslots = async (req, res) => {
    try {
        const timeslotsRef = db.collection('interviewTimeslots');

        const snapshot = await timeslotsRef.get();

        const timeslots = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            timeslots.push({
                date: data.date,
                timeSlot: data.timeSlot,
            });
        });

        if (timeslots.length === 0) {
            res.status(200).json({ message: "All timesslots are available", status: false });
        }

        res.status(200).json({ message: "Timeslots fetched successfully", timeslots, status: true });
    } catch (error) {

        res.status(500).json({ error: 'Internal server error', status: "false" });
    }
};

exports.fetchConsultations = async (req, res) => {
    try {
        const usersRef = db.collection('consultations');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'No consultations found', status: false });
        }

        const consultations = [];

        snapshot.forEach((doc) => {
            consultations.push({
                id: doc.id,
                data: doc.data(),
            });
        });

        res.status(200).json({ message: "Consultations fetched successfully", consultations, status: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Fetching consultations failed', status: false });
    }
};

exports.fetchConsultationsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required', status: false });
        }

        const consultationRef = db.collection('consultations').doc(id);
        const consultationDoc = await consultationRef.get();

        if (!consultationDoc.exists) {
            return res.status(404).json({ error: 'Consultation not found', status: false });
        }

        const consultationData = consultationDoc.data();

        res.status(200).json({ message: 'Consultation fetched succesfully', consultation: consultationData, status: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Fetching consultation details failed', status: false });
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
                return res.status(404).json({ error: 'User not found', status: false });
            }

            await userRef.update({ ...userDoc.data(), image: url });

            return res.status(201).send('Image uploaded successfully.');
        });

        stream.end(file.buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error.');
    }
};