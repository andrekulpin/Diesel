var diesel = require('../diesel');
diesel()
	.goto('http://www.yandex.ru')
	.evaluate(function(){
		return document.title;
	})
	.end()
	.then(function(data){
		console.log(data);
	})
	.catch(function(err){
		console.log(err);
	})
