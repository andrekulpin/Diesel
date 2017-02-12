const diesel = require('./diesel');

diesel({
	debug: true
})
.goto('https://search.aviasales.ru/MOW0203LED1')
.wait(4000)
.end(function(){
	console.log('done')
})