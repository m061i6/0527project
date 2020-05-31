const Person = require(__dirname + '/person.js');
const pc = new Person('jack', 20);
console.log(pc);
console.log(pc.toJSON());