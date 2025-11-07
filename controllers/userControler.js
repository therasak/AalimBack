const User = require('../models/User');

const login = async (req, res) => {
    console.log("HGVGVg");
    
  const { userId, password} = req.body;
  console.log('Received:', userId, password); 

  const isUser = await User.findOne({ userId });

  if (!isUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (isUser.password !== password) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  res.json({ message: 'Success', user: isUser });
};

module.exports = { login };
