const router=require('express').Router();const Product=require('../models/Product');const {auth,admin}=require('../middleware/auth');
router.get('/',async(req,res)=>res.json(await Product.find().sort({createdAt:-1})));
router.post('/',auth,admin,async(req,res)=>{try{res.status(201).json(await Product.create(req.body))}catch(e){res.status(400).json({message:e.message})}});
router.put('/:id',auth,admin,async(req,res)=>{try{res.json(await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}))}catch(e){res.status(400).json({message:e.message})}});
router.delete('/:id',auth,admin,async(req,res)=>{await Product.findByIdAndDelete(req.params.id);res.json({message:'Product deleted'})});module.exports=router;
