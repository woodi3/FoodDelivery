
// console.log(args);
var db = connect('127.0.0.1:27017/food');
function prettyPrint(collection){
  print("Printing: "+ collection);
}
var users = db.users.find();
prettyPrint('users');
while(users.hasNext()){
   printjson(users.next());
}
