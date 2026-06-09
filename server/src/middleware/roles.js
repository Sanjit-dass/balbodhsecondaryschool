module.exports = function(allowedRoles = []){
  return function(req,res,next){
    const user = req.user;
    if(!user) return res.status(401).json({ message: 'Unauthorized' });
    if(allowedRoles.length && !allowedRoles.includes(user.role)){
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }
}
