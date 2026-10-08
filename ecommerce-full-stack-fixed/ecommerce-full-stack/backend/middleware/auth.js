const jwt=require('jsonwebtoken');
const User=require('../models/User');
async function auth(req,res,next){try{const token=req.headers.authorization?.split(' ')[1];if(!token)return res.status(401).json({message:'Authentication required'});const decoded=jwt.verify(token,process.env.JWT_SECRET);req.user=await User.findById(decoded.id).select('-password');if(!req.user)return res.status(401).json({message:'Invalid user'});next()}catch(e){res.status(401).json({message:'Invalid or expired token'})}}
function admin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required'});next()}
module.exports={auth,admin};
