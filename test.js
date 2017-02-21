const Diesel = require('./index');

Diesel()
.goto('http://www.yandex.ru')
.wait(3000)
.end()