const admin = require('firebase-admin');
const User = require('../models/User');
const { db } = require('../services/firebaseService')
const jwt = require('jsonwebtoken');

exports.createAdmin = async (req, res) => {
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

        if (userDoc.data().type !== 'super admin') {
            return res.status(403).json({ error: 'Permission denied. Only super admins can create a new admin.', status: false });
        }

        const { name, email, password } = req.body;

        const emailCheck = await db.collection('users')
            .where('email', '==', email)
            .where('type', '==', 'admin')
            .get();

        if (!emailCheck.empty) {
            return res.status(400).json({ error: 'Email already exists in the database.', status: false });
        }

        const userData = {
            name: name,
            email: email,
            password: password,
            type: 'admin'
        };

        await db.collection('users').add(userData);
        res.status(201).json({ message: 'Admin created successfully', status: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Admin registration failed', status: false });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        let uid = null;

        if (!email || !password) {
            return res.status(400).json({ error: 'Phone number and Password are required.', status: false });
        }

        await db.collection('users')
            .where('email', '==', email)
            .where('type', 'in', ['admin', 'super admin'])
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

exports.fetchUsers = async (req, res) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef
            .where('type', '==', 'user')
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'No user found', status: false });
        }

        const users = [];

        snapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                data: doc.data(),
            });
        });

        res.status(200).json({ message: "Users fetched successfully", users, status: true });
    } catch (error) {
        res.status(500).json({ error: 'Fetching users failed', status: false });
    }
};

exports.fetchUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required', status: false });
        }

        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        const userData = userDoc.data();

        res.status(200).json({ message: 'User details fetched successfully', user: userData, status: true });
    } catch (error) {
        res.status(500).json({ error: 'Fetching user details failed', status: false });
    }
};

exports.changeAdminPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, "Secret!@#Key", { algorithm: 'HS256' });

        let uid = decodedToken.uid;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required', status: false });
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        const user = userDoc.data();

        if (user.type !== 'admin' && user.type !== 'super admin') {
            return res.status(403).json({ error: 'Permission denied.', status: false });
        }

        await userDoc.update({ ...user, password: newPassword });

        res.status(200).json({ message: 'Password changed successfully', status: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Password change failed', status: false });
    }
};

exports.interviewTimeslot = async (req, res) => {
    try {
        const { date, timeSlot } = req.body;

        const timeslotsRef = db.collection('interviewTimeslots');

        await timeslotsRef.add({
            date,
            timeSlot
        });

        res.status(201).json({ message: "Timeslot removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.changeUserStatus = async (req, res) => {
    try {
        const { newStatus, userId } = req.body;

        if (!userId || !newStatus) {
            return res.status(400).json({ error: 'User ID and newStatus are required', status: false });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found', status: false });
        }

        await userRef.update({ ...userDoc.data(), status: newStatus });

        res.status(200).json({ message: 'User status updated successfully', status: true });
    } catch (error) {
        res.status(500).json({ error: 'Updating user status failed', status: false });
    }
};