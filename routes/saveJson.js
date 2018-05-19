var fs = require('fs');

function saveJson(req,res){
	fs.writeFile('./public/json/'+req.body.stockName+".json",JSON.stringify(req.body.stockVal),function(err){
		if(err){
			console.log(err);
		}
	});
	res.send();
};

exports.saveJson = saveJson;