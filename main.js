var express = require('express'),
	mysql = require('mysql'),
	myApp = express(),
	bodyParser = require('body-parser'),
	urlencodedParser = bodyParser.urlencoded({ extended: false }),
	port = process.env.PORT || 8080;

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'dbmsProject'
});

connection.connect(function(err){
	if(err){
		console.log('Error: '+err.message);
	} else{
		console.log('Connected');
	}
});

myApp.set('view engine', 'ejs');
myApp.use('/assets', express.static('assets'));
myApp.use('/images', express.static('images'));
myApp.get('/', function(req, res){
	res.render('user');
});

//User-Authentication
myApp.post('/userAuth', urlencodedParser, function(req, res){
	var sqlQuery = 'SELECT * FROM customer WHERE name = ' + mysql.escape(req.body.fname) + ' AND email = ' +
	mysql.escape(req.body.email);
	connection.query(sqlQuery, function(error, results){
			if(error){
				console.log('Error');
			} else if(results.length == 0){
					console.log('You are a new member');
					query01 = 'INSERT INTO customer (name, email, phone) VALUES (' + mysql.escape(req.body.fname) 
					+ ', ' + mysql.escape(req.body.email) + ', ' + mysql.escape(req.body.phone) + ')'; 
					connection.query(query01, function(err, results){
					if(err){
						console.log(err.message);
						console.log('Error: couldn\'t insert records into the customer tables');
					} else{
						console.log('inserted '+results.affectedRows+' records to the customer table');
						query02 = 'SELECT customerId, name FROM customer WHERE name = '+mysql.escape(req.body.fname)+' AND email='+
						mysql.escape(req.body.email);
						connection.query(query02, function(err, results1){
							if(err){
								console.log('Error: ' + err.message)
							} else{
								res.render('order', {customerId: results1[0].customerId, name: results1[0].name});
								}
							})	
						}
					});
			} else if(results[0].name === req.body.fname && results[0].email === req.body.email){
				console.log('You are an already registered member');
					query02 = 'SELECT * FROM customer WHERE name = '+mysql.escape(req.body.fname)+' AND email='+
					mysql.escape(req.body.email);
					connection.query(query02, function(err, result){
						if(err){
							console.log('Error: ' + err.message)
						} else{
							res.render('order', {customerId: results[0].customerId, name: results[0].name});
				}
			})	
		}
	});
});
//User-Order
myApp.post('/order/:customerId/:name', urlencodedParser, function(req, res){
	myQuery = `SELECT chef.chefName, fooditems.foodName, fooditems.foodCost FROM fooditems
	INNER JOIN chef ON fooditems.chefId = chef.chefId`;
	let listQ = Array();
	connection.query(myQuery, function(err, results){
		if(err){
			console.log(`Error: err.message`)
		} else{
		let total = 0, str = "", flag = 0, chefNames = {};	
		for(key in req.body){
			if(Number(req.body[key]) > 0){

				flag = 1;
				for(let i=0;i<results.length;++i){
					if(results[i].foodName === key){
						total += Number(results[i].foodCost) * Number(req.body[key])
						str = str + results[i].foodName;
						str = str + ' & ';
						chefNames[results[i].foodName] = results[i].chefName;
					}	
				}
			}
		}
		if(flag == 1){
			str = str.slice(0, -3);
			query2 = 'INSERT INTO custorder (foodItems, totalAmount, customerId) VALUES ( ' 
			+ mysql.escape(str) + ', '+ mysql.escape(Number(total))+', '+ mysql.escape(Number(req.params.customerId))+')';
			connection.query(query2, function(err, results1){
				if(err){
					console.log(`Error: ${err.message}`);
				} else{
					query3 = 'SELECT waiterName FROM waiter';
					connection.query(query3, function(err, results3){
						if(err){
							console.log(err.message)
						} else{
							query4 = 'SELECT MAX(orderNo) as retOrderNo FROM custorder AS orderNo';
							connection.query(query4, function(err, results4){
								if(err){
									console.log(err);
								}
								else{
									 obj = {
									customerName: req.params.name, 
									customerId: req.params.customerId,
									joinResult: chefNames, 
									totalAmount: total, 
									request: req.body, 
									waiter: results3,
									orderNo:  results4[0].retOrderNo
								}
					console.log(obj.orderNo);
					res.render('orderSuccess', obj);
							}
						})
				}
			})
		} 
		})
	} else{
			query = 'DELETE FROM customer WHERE customerId = '+mysql.escape(req.params.customerId);
			connection.query(query, function(err, resultsD){
				if(err){
					console.log(`Error: ${err.message}`);
				} else{
					console.log('User didn\'t order anything')
				}
			})
			res.render('user')
		}	
		}
	})
})

myApp.post('/pay/:customerId/:customerName', function(req, res){
	res.render('pay', {customerId: req.params.customerId, name: req.params.customerName})
})

myApp.post('/reorder/:customerId/:customerName/:orderNo', function(req, res){
	query = 'DELETE FROM custorder WHERE orderNo = ' + mysql.escape(req.params.orderNo);
	connection.query(query, function(err, results){
		if(err){
			console.log(`Error: ${err.message}`);
		} else{
			console.log('We have removed Ur previous order');
			res.render('reorder', {customerId: req.params.customerId, condition: true, name: req.params.customerName, orderNo: req.params.orderNo});
		}
	})
})
myApp.post('/orderSecond/:customerId/:name/:orderNo', urlencodedParser, function(req, res){
	myQuery = `SELECT chef.chefName, fooditems.foodName, fooditems.foodCost FROM fooditems
	INNER JOIN chef ON fooditems.chefId = chef.chefId`;
	let listQ = Array();
	connection.query(myQuery, function(err, results){
		if(err){
			console.log(`Error: err.message`)
		} else{
		let total = 0, str = "", flag = 0, chefNames = {};	
		for(key in req.body){
			if(Number(req.body[key]) > 0){
				flag = 1;
				for(let i=0;i<results.length;++i){
					if(results[i].foodName === key){
						total += Number(results[i].foodCost) * Number(req.body[key])
						str = str + results[i].foodName;
						str = str + ' & ';
						chefNames[results[i].foodName] = results[i].chefName;
					}	
				}
			}
		}
		if(flag == 1){
			str = str.slice(0, -3);
			query2 = 'INSERT INTO custorder (foodItems, totalAmount, customerId) VALUES ( ' 
			+ mysql.escape(str) + ', '+ mysql.escape(Number(total))+', '+ mysql.escape(Number(req.params.customerId))+')';
			connection.query(query2, function(err, results1){
				if(err){
					console.log(`Error: ${err.message}`);
				} else{
					query3 = 'SELECT waiterName FROM waiter';
					connection.query(query3, function(err, results3){
						if(err){
							console.log(err.message)
						} else{
							obj = {
								customerName: req.params.name, 
								customerId: req.params.customerId,
								orderNo: req.params.orderNo,
								joinResult: chefNames, 
								totalAmount: total, 
								request: req.body, 
								waiter: results3
					}
					res.render('orderSuccess', obj);
						}
					})
				}
			})
		} else{
			query = 'DELETE FROM customer WHERE customerId = '+mysql.escape(req.params.customerId);
			connection.query(query, function(err, resultsD){
				if(err){
					console.log(`Error: ${err.message}`);
				} else{
					console.log(`${resultsD}`)
				}
			})
			res.render('user')
		}	
		}
	})
})
myApp.listen(port);

