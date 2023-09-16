const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/astrologerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();

require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/astrologer', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
