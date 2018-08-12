var client = require('twilio')(
  '',
  ''
);
var first_name = "";
var last_name = "";
var address = "";
var city = "";
var income = "";
var pdfFiller   = require('pdffiller');
var express = require('express');  
const translate = require('google-translate-api');
var AssistantV1 = require('watson-developer-cloud/assistant/v1');
var app = express();
var contexts = [];
app.get('/getmsg', function (req, res) 
{
  var message = req.query.Body;    
  var number = req.query.From;
  var twilioNumber = req.query.To;
  var intent_checker = false;
  var context = null;
  var index = 0;
  var contextIndex = 0;
var a;
function record_data(number)
{ 
    var sourcePDF = "f1040.pdf";
    var doc_name_temp = String(number+".pdf");
    var destinationPDF = "../var/www/html/"+doc_name_temp;
     var data = 
    {
        "" : first_name,
        "" : last_name,
        "" : address,
        "" : city,
        "" : income
    }
    pdfFiller.fillForm( sourcePDF, destinationPDF, data, function(err) {
        if (err) throw err;
        console.log("Data Was Recorded!");
    });
}
function getTranslation(inc_text)
{
  translate(inc_text, {to: 'en'}).then(res => {
    console.log(res.text);
    console.log(res.from.language.iso);
    a =res.text;
    send_message(a);
}).catch(err => {
    console.error(err);
});
}

function send_pdf(argument)
{
  client.messages.create({
    from: twilioNumber, 
    body: '',
    to: number
    })
}

  function send_message(argument)
  {
    client.messages.create({
      from: twilioNumber,
      to: number,
      body: argument
      })
  }
  contexts.forEach(function(value) {
    if (value.from == number) 
    {
      context = value.context;
      contextIndex = index;
    }
    index = index + 1;
  });
  console.log('Recieved message from' + number + ' saying \'' + message  + '\''); 
  var assistant = new AssistantV1({
    url: "https://gateway.watsonplatform.net/assistant/api",
    username: "",
    password: "",
    version: '2018-02-16'
  });
  assistant.message(
    {
    input: 
    { 
        text: message 
    },
    workspace_id: '',
    context: context 
   }, function(err, response) 
   { 
       if (err) 
       {
         console.error(err);
       } 
       else 
       {
        if (response.output.text[0] == "What is your last name?")
        {
            console.log("First Data Being Recorded In a Variable");
            first_name = message;
        }
        else if(response.output.text[0] == "What is your current home address?")
        {
            console.log("Second Data Being Recorded In a Variable");
            last_name = message;
        }
        else if(response.output.text[0] == "What is your home city, state, and zip code?")
        {
            console.log("Third Data Being Recorded In a Variable");
            address = message;
        }
        else if(response.output.text[0] == "How much money did you make in 2017? (Can be found on your W-2)")
        {
            console.log("Fourth Data Being Recorded In a Variable");
            city = message;
        }
        else if (response.output.text[0] == "Thank you for filling out your 1040! For the purpose of this demo, we will stop here. This is your \"completed\" tax form.")
        {
            console.log("Final Data Being Recorded In a Variable");
            income=message;
            console.log("Data Being Sent to Recording Function");
            record_data(number);
            send_pdf(number);
        }
        //console.log(response); //fuking up code, #1
        //console.log(JSON.stringify(context));
        send_message(response.output.text[0]);
         console.log("Server Response: ",response.output.text[0]);
         if (context == null) 
         {//if user is new - output the message and number
           contexts.push({'from': number, 'context': response.context});
         } else 
         {
           contexts[contextIndex].context = response.context;
         }
       }
  });
  res.send('');
});
app.listen('', function () {
  console.log('');
});