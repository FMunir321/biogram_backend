require('dotenv').config();
const mongoose = require('mongoose');

// mongoose.connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }
// ).then(() => {
//     console.log('MongoDB connected successfully');
// }).catch(err => {
//     console.error('MongoDB connection error:', err);
// });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });