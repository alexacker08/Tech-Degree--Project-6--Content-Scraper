
//Grab all the URLs from the shirts4Mike shirts page

var cheerio = require('cheerio');
var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');

var url = 'http://www.shirts4mike.com';
var dataCapture = new Array();
var fields = ['title', 'price', 'image', 'url', 'time'];
var dir = './data';


//Function to check and see if a directory folder must be created
function createDirectory(dir, callback){
	fs.stat(dir, function(err, status){
		if(err & err.errno == 34){
			fs.mkdir(dir, callback)
		} else {
			callback(err);
		}
	});
}

function customDate(){
	var date = new Date();

	var month = date.getMonth() + 1;
	var day = date.getDay();
	var year = date.getFullYear();
	var fullDate = year + '-' + month + '-' + day;
	var fullDateYear = fullDate.toString();

	return fullDateYear;

}

try {

	fs.accessSync('scraper-error.log');

} catch(e){

	fs.writeFile('scraper-error.log', 'Error Messages Left Here', function(err){
		if(err) throw err;
		console.log('Error Log Saved');

	});

}

function appendError(error){
	var date = new Date();
	var dateString = date.toString();
	var errorMessage = error.message;

	var logMessage = '[' + dateString + '] ' + '<' + errorMessage + '>';


	fs.appendFile('scraper-error.log', logMessage, function(err){
		if(err) throw err;
		console.log('Data was appeneded');

	});
}

//Request the Shirts 4 Mike Homepage
request(url, function(error, response, html){
	if(!error & response.statusCode == 200){
		var $ = cheerio.load(html);
		
		var shirtsPage = $('.shirts a').attr('href');
		var shirtsUrl = url + '/' + shirtsPage;

		//Request the Shirt Product page
		request(shirtsUrl, function(error, response, html){
			if(!error){
				var $ = cheerio.load(html);

				//Grab all the shirt aTags in the Shirts product page
				var shirtLinks = $('.products li a');
				var numberofShirts = shirtLinks.length;

				//Loop through each shirt making a request and grabbing hte necessary information out.
				$(shirtLinks).each(function(i, element){
					var eachShirtUrl = $(this).attr('href');
					var eachShirtUrlTotal = url + '/' + eachShirtUrl;

					request(eachShirtUrlTotal, function(error, response, html){
							if(!error){
							var $ = cheerio.load(html);
							var pageInfo = {};
							var newDate = new Date();
							var newDateString = newDate.toString();

							pageInfo.title = $('.shirt-details h1').text().slice(4);
							pageInfo.price = $('.shirt-details .price').text();
							pageInfo.image = $('.shirt-picture img').attr('src');
							pageInfo.url = eachShirtUrlTotal;
							pageInfo.time = newDateString;

							dataCapture.push(pageInfo);

							if(dataCapture.length === numberofShirts){

								try {
									fs.accessSync(dir)
								} catch (e){
									fs.mkdirSync(dir);
									console.log('Directory Made');
								}						

								json2csv({data: dataCapture, fields: fields}, function(error, json){
									
									var date = customDate();

									if(error){
										appendError(error)
									} else {
										console.log('JSON Converted'); 
									}

									fs.writeFile(dir + '/' + date + '.csv', json, function(error){
										if(error){
											appendError(error);
										} else {
											console.log('the file has been saved');
										}

									});
								});
							}

						} else {

							appendError(error)

						}
					});
				});

			} else {

				appendError(error);

			}
		});

	} else {

		appendError(error);

	}
});

//Grab the Title
//Grab the Price
//Grab the URL
//Shirt IMG src