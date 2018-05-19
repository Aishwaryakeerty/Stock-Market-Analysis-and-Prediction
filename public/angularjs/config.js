var app = angular.module('tradeApp', ['ngRoute']);
app.config(function($routeProvider) {
	$routeProvider
	.when("/", {
		templateUrl : "template/landing.html"
	})
	.when("/login", {
		templateUrl : "template/login.html"
	})
	.when("/register", {
		templateUrl : "template/register.html"
	})
	.when("/home", {
		templateUrl : "template/home.html"
	})
	.when("/stock", {
		templateUrl : "template/stock.html"
	})
	.when("/compare", {
		templateUrl : "template/compare.html"
	})
	.when("/statistics", {
		templateUrl : "template/statistics.html"
	});

});

app.run(function($rootScope){
	$rootScope.stocks = [{symbol:"AAPL",stock:"Apple Inc.",watchlist:true},{symbol:"BABA",stock:"Alibaba",watchlist:false}, {symbol:"GOOGL",stock:"Alphabet Inc.",watchlist:false}, {symbol:"MSFT",stock:"Microsoft Corporation",watchlist:false},{symbol:"AMZN",stock:"Amazon",watchlist:false}, {symbol:"UPS",stock:"United Parcel Service",watchlist:false}];
	$rootScope.fetchData = false;
})

app.controller('homeController', function($scope, $http,$rootScope) {
	$scope.show = false;
	$scope.changeWatchlist = function(value){
		value.watchlist = !value.watchlist; 
	}
	$http({
		method: 'GET',
		url: 'https://www.alphavantage.co/query?function=SECTOR&apikey=3H5E0OS0FYSDHWUQ'

	}).then(function successCallback(response) {
		$scope.sector = response.data["Rank A: Real-Time Performance"];
	}, function errorCallback(error) {
		alert('Unable to get data');
	});

	$http({
		method: 'GET',
		url: 'https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=AAPL,BABA,GOOGL,MSFT,AMZN,UPS&apikey=3H5E0OS0FYSDHWUQ'

	}).then(function successCallback(response) {
		$scope.stocksVal = response.data["Stock Quotes"];

	}, function errorCallback(error) {
		alert('Unable to get stock data');
	});


	$scope.snpChart = function () {
		var dataPoints = [];
		var snpChart = new CanvasJS.Chart("s&p", {
			theme: "light1",
			animationEnabled: true,
			zoomEnabled: true,
			title: {
				text: "S&P Index"
			},
			axisY:{
				minimum: 2550
			},
			data: [{
				type: "area",
				dataPoints: dataPoints
			}]
		});

		function addData(data) {
			var xVal = "", yVal = 100, count = 0;
			$scope.snpVal = data;
			delete $scope.snpVal["Meta Data"];
			$scope.snpVal = $scope.snpVal["Time Series (Daily)"];
			$.each($scope.snpVal, function(k, v) {
				yVal = parseInt(v["4. close"]) ;
				xVal = new Date(k.split(" ")[0]);
				xVal.setDate(xVal.getDate() + 1);
				snpChart.options.data[0].dataPoints.push({x: xVal,y: yVal});	
				count++;
				return (count !== 40);
			});
			
			
			snpChart.render();
			$scope.show = true;
		}

		//$.getJSON("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=.INX&apikey=3H5E0OS0FYSDHWUQ", addData);
		$.getJSON('/json/INX.json',addData);

	}

	$scope.sectorChart = function(){
		var dataPoints = [];

		var chart = new CanvasJS.Chart("chartContainer", {
			theme: "light1",
			animationEnabled: true,
			title: {
				text: "Sector Performance"
			},
			data: [{
				type: "doughnut",
				indexLabel: "",
				startAngle: 25,
				toolTipContent: "{legendText} {y}",
				dataPoints: [
					{ y: 1.97, legendText: "Information Technology" },
					{ y: 1.40, legendText: "Consumer Staples" },
					{ y: 1.31, legendText: "Consumer Discretionary" },
					{ y: 1.28, legendText: "Materials" },
					{ y: 1.24, legendText: "Financials" },
					{ y: 1.14, legendText: "Industrials" },
					{ y: 1.08, legendText: "Real Estate" },
					{ y: 0.75, legendText: "Health Care" },
					{ y: 0.75, legendText: "Telecommunication Services" },
					{ y: 0.45, legendText: "Energy" },
					{ y: 0.39, legendText: "Utilities" }
					]
			}]
		});
		chart.render();

	}

});

app.controller('stockController', function($scope, $http,$rootScope) {
	$scope.show = false;
	$scope.stockvalue = $rootScope.stocks[0].symbol;
	$scope.stockChart = function (symbol, prediction) {
		var dataPoints = [];
		if(!symbol)
			symbol = $rootScope.stocks[0].symbol;
		var stockChart = new CanvasJS.Chart("stock", {
			theme: "light1",
			animationEnabled: true,
			zoomEnabled: true,
			title: {
				text: symbol+" Stock Price"
			},
			axisX: {
				labelFormatter: function (e) {
					return CanvasJS.formatDate( e.value, "DD MMM");
				},
				labelAngle: -10
			},
			data: [{
				type: "area",
				dataPoints: dataPoints
			}]
		});
		if(prediction)
			$.get("/prediction/results.csv", addPrediction); 

		function addData(data) {
			var xVal = "", yVal = 100, count = 0;
			$scope.stockVal = data;
			if($rootScope.fetchData){
				delete $scope.stockVal["Meta Data"];
				$scope.stockVal = $scope.stockVal["Time Series (Daily)"];
				$http({
					method: 'POST',
					url: '/saveJson',
					data: {
						stockName: symbol,
						stockVal: $scope.stockVal
					}
				}).then(function successCallback(response) {
				}, function errorCallback(response) {
					console.log(response);
				});
			}
			$.each($scope.stockVal, function(k, v) {

				yVal = parseInt(v["4. close"]) ;
				xVal = new Date(k.split(" ")[0]);
				xVal.setDate(xVal.getDate() + 1);
				stockChart.options.data[0].dataPoints.push({x: xVal,y: yVal});	
				count++;
				return (count !== 40);
			});
			stockChart.render();
			$scope.show = true;
		}
		function addPrediction(csv){
			csvLines = csv.split(/[\r?\n|\r|\n]+/);
			var arr = [];
			for (var i = 1; i < csvLines.length; i++){
				if (csvLines[i].length > 0) {
					points = csvLines[i].split(",");
					if(symbol == points[0] && prediction == points[1]){
						arr.push(Number(points[5]));
					}
				}
			}
			var avg_prediction = 0;
			arr.forEach(function(value){
				avg_prediction+=value;
			});
			avg_prediction/=arr.length;
			console.log(avg_prediction);
			var xVal= new Date();
			xVal.setDate(xVal.getDate() + prediction+1);
			stockChart.options.data[0].dataPoints.push({ 
				x: xVal, 
				y: parseFloat(avg_prediction),
				markerColor: "tomato",
				markerType: "cross",
				markerSize: 12
			});
			
		}

		if($rootScope.fetchData)
			$.getJSON("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol +"&outputsize=compact&apikey=3H5E0OS0FYSDHWUQ&datatype=json", addData);
		else
			$.getJSON('/json/'+symbol+".json",addData);

	}

	$scope.stockChart();
});

//Statistics Controller 

app.controller('statisticsController', function($scope, $http,$rootScope) {
	$scope.stockvalue = $rootScope.stocks[0].symbol;
	$scope.statisticsChart = function (symbol, prediction) {
		var dataPoints = [];
		symbol = $scope.stockvalue;
		console.log(symbol);
		if(!symbol)
			symbol = $rootScope.stocks[0].symbol;
		var stockChart = new CanvasJS.Chart("stock", {
			theme: "light1",
			animationEnabled: true,
			zoomEnabled: true,
			title: {
				text: symbol+" Stock Price"
			},

			subtitles: [{
				text: "Daily Averages"
			}],
			axisX: {
				interval: 1,
				labelFormatter: function (e) {
					return CanvasJS.formatDate( e.value, "DD MMM");
				},
				labelAngle: -10
			}
			,
			axisY: {
				includeZero: false,
				prefix: "$",
				title: "Price"
			}
			,
			toolTip: {
				content: "Date: {x}<br />Open: {y[0]}, Close: {y[3]}<br />High: {y[1]}, Low: {y[2]}"
			},
			data: [{
				type: "candlestick",
				yValueFormatString: "$##0.00",
				dataPoints: dataPoints
			}]
		});

		function addData(data) {
			var xVal = "", count = 0;
			$scope.stockVal = data;
			if($rootScope.fetchData){
				delete $scope.stockVal["Meta Data"];
				$scope.stockVal = $scope.stockVal["Time Series (Daily)"];
				$http({
					method: 'POST',
					url: '/saveJson',
					data: {
						stockName: symbol,
						stockVal: $scope.stockVal
					}
				}).then(function successCallback(response) {
				}, function errorCallback(response) {
					console.log(response);
				});
			}
			
			$.each($scope.stockVal, function(k, v) {
				xVal = new Date(k.split(" ")[0]);
				xVal.setDate(xVal.getDate() + 1);
				dataPoints.push({
					x: xVal,
					y: [
						parseFloat(v["1. open"]),
						parseFloat(v["2. high"]),
						parseFloat(v["3. low"]),
						parseFloat(v["4. close"])
						]
				});
				count++;
				return (count !== 40);
			});
			stockChart.render();
		}

		if($rootScope.fetchData)
			$.getJSON("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol +"&outputsize=compact&apikey=3H5E0OS0FYSDHWUQ&datatype=json", addData);
		else
			$.getJSON('/json/'+symbol+'.json',addData);
	}

	$scope.statisticsChart();
});

//compare controller 
app.controller('compareController', function($scope, $http,$rootScope) {
	$scope.stockvalue1 = $rootScope.stocks[0].symbol;
	$scope.stockvalue2 = $rootScope.stocks[1].symbol;
	$scope.compareChart = function () {
		var dataPoints1 = [],dataPoints2 = [];
		var compareChart = new CanvasJS.Chart("compare", {
			animationEnabled: true,
			title: {
				text: "Stock Value Comparision"
			},
			axisX: {
				interval: 1,
				labelFormatter: function (e) {
					return CanvasJS.formatDate( e.value, "DD MMM");
				},
				labelAngle: -10
				
			},
			axisY: {
				includeZero: false,
				prefix: "$",
				title: "Price"
			},
			legend: {
				verticalAlign: "top",
				horizontalAlign: "right",
				dockInsidePlotArea: true
			},
			toolTip: {
				shared: true
			},
			data: [{
				name: $scope.stockvalue1,
				showInLegend: true,
				legendMarkerType: "square",
				type: "area",
				color: "rgba(40,175,101,0.6)",
				markerSize: 0,
				dataPoints: dataPoints1
			},
			{
				name: $scope.stockvalue2,
				showInLegend: true,
				legendMarkerType: "square",
				type: "area",
				color: "rgba(0,75,141,0.7)",
				markerSize: 0,
				dataPoints: dataPoints2
			}]
		});
		function addData1(data) {
			var xVal = "", yVal = 100, count = 0;
			$scope.stockVal = data;
			if($rootScope.fetchData){
				delete $scope.stockVal["Meta Data"];
				$scope.stockVal = $scope.stockVal["Time Series (Daily)"];
				$http({
					method: 'POST',
					url: '/saveJson',
					data: {
						stockName: symbol,
						stockVal: $scope.stockVal
					}
				}).then(function successCallback(response) {
				}, function errorCallback(response) {
					console.log(response);
				});
			}
			$.each($scope.stockVal, function(k, v) {

				yVal = parseInt(v["4. close"]) ;
				xVal = new Date(k.split(" ")[0]);
				xVal.setDate(xVal.getDate() + 1);
				
				compareChart.options.data[0].dataPoints.push({x: xVal,y: yVal});	
				count++;
				return (count !== 40);
			});
			
		}
		function addData2(data) {
			var xVal = "", yVal = 100, count = 0;
			$scope.stockVal = data;
			if($rootScope.fetchData){
				delete $scope.stockVal["Meta Data"];
				$scope.stockVal = $scope.stockVal["Time Series (Daily)"];
				$http({
					method: 'POST',
					url: '/saveJson',
					data: {
						stockName: symbol,
						stockVal: $scope.stockVal
					}
				}).then(function successCallback(response) {
				}, function errorCallback(response) {
					console.log(response);
				});
			}
			$.each($scope.stockVal, function(k, v) {
				yVal = parseInt(v["4. close"]) ;
				xVal = new Date(k.split(" ")[0]);
				xVal.setDate(xVal.getDate() + 1);
				compareChart.options.data[1].dataPoints.push({x: xVal,y: yVal});	
				count++;
				return (count !== 40);
			});
			compareChart.render();
			
		}
		
		if($rootScope.fetchData){
			$.getJSON("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + $scope.stockvalue1 +"&outputsize=compact&apikey=3H5E0OS0FYSDHWUQ&datatype=json", addData1);
			$.getJSON("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + $scope.stockvalue2 +"&outputsize=compact&apikey=3H5E0OS0FYSDHWUQ&datatype=json", addData2);
		}
		else{
			$.getJSON('/json/'+$scope.stockvalue1+'.json',addData1);
			$.getJSON('/json/'+$scope.stockvalue2+'.json',addData2);
			}
	}

	$scope.compareChart();
});
