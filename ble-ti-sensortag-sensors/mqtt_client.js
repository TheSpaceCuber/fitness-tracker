//------------------MQTT---------------

var mqtt;
var host = "j7TPsoTxU5fLSBsnZqIZXA.mywire.org"//"broker.hivemq.com"//
var port = 9001
var benchpressCtr = [0,0]
var squatCtr = [0,0]
var deadliftCtr = [0,0]

function onConnect() 
{
    console.log("Connected");
    mqtt.subscribe("exerciseData")
    message = new Paho.MQTT.Message("Hello world");
    message.destinationName = "lanjiao";
    mqtt.send(message);
    console.log("sent");
}

function onMessageArrived(msg)
{
    outMessage = msg.payloadString;
    console.log(outMessage)
    if (outMessage == "Bench press") 
    {
        benchpressCtr[1] = benchpressCtr[1] + 1
        
        addItem("dynamic_benchpress", outMessage, benchpressCtr[1])
    }
    else if (outMessage == "Deadlift")
    {
        deadliftCtr[1] = deadliftCtr[1] + 1
        addItem("dynamic_deadlift", outMessage, deadliftCtr[1])
    }
    else if (outMessage == "Squat")
    {
        squatCtr[1] = squatCtr[1] + 1
        addItem("dynamic_squat", outMessage, squatCtr[1])
    }
    else if (outMessage == "Rest")
    {
        deadliftCtr[1] = 0
        benchpressCtr[1] = 0
        squatCtr[1] = 0
    }    //addItem("dynamic_benchpress", outMessage, 0)
}

function MQTTconnect()
{
    console.log("hello beech")
    console.log("connecting to "+ host + " "+ port);
    mqtt = new Paho.MQTT.Client(host, port, "clientjs")
    options = {timeout: 50, onSuccess: onConnect,userName: "bearcub", password: "xBTBOXuWBPIk7rEuHzZ0aw"};
    mqtt.onMessageArrived = onMessageArrived;
    mqtt.connect(options);
    console.log("still trying")
}

function sendSensorData(sensorData)
{
    message = new Paho.MQTT.Message(sensorData);
    message.destinationName = "sensorData"
    mqtt.send(message);
}


function updateExerciseRep(listId, exerciseCtr)
{   
    var weight = document.getElementById("weightsField").value
    
    const ul = document.getElementById(listId)
    
    var li = ul.getElementsByTagName('li');
    var lastItem = li[li.length -1]
    var inputs = lastItem.getElementsByTagName('input')
    var weightUsed = inputs[0].value
    var reps = inputs[1].value

    inputs[1].value = exerciseCtr
}


function addItem(list, itemName, exerciseCtr)
{
    if (exerciseCtr == 1)
    {
        var weight = document.getElementById("weightsField").value
        var ul = document.getElementById(list);
        
        var li = document.createElement("li");
        li.setAttribute('id',"ownListItem");
        li.setAttribute("exerciseInfo", [weight, exerciseCtr])
        //li.style = "font-size: 15px;"

        var div1 = document.createElement("span")
        div1.style = "display: inline-block;"

        var input = document.createElement("input")
        input.setAttribute('id', "ownInput")
        input.type = "text"
        input.inputMode = "decimal"
        input.value = weight
        input.size = 20
        
        div1.appendChild(input)

        var div2 = document.createElement("span")
        div2.style = "display: inline-block; margin-left: -20px;"
        div2.innerHTML = "kg  \xa0x\xa0"


        var input2 = document.createElement("input")
        input2.setAttribute('id', "ownInput")

        input2.type = "text"
        input2.inputMode = "decimal"
        input2.value = exerciseCtr
        input2.size = 20
        div2.appendChild(input2)
        
        li.appendChild(div1)
        li.appendChild(div2)
        ul.appendChild(li);
    }
    else {
        updateExerciseRep(list, exerciseCtr)
    }
}

//Updates the database on the exercise data when a button(TBC) is pressed
function updateDatabase(){
    var date = new Date().toLocaleString()
    console.log(date)
    dbData = {}
    var benchPress = {}
    var squat = {}
    var deadlift = {}
    const benchPressList = document.getElementById("dynamic_benchpress").getElementsByTagName('li')
    const squatList = document.getElementById("dynamic_squat").getElementsByTagName('li')
    const deadliftList = document.getElementById("dynamic_deadlift").getElementsByTagName('li')

    for (var i =0; i < benchPressList.length; i ++){
        var inputs = benchPressList[i].getElementsByTagName('input');
        benchPress[i] = [inputs[0].value, inputs[1].value]       
    }
    for (var i =0; i < squatList.length; i ++){
        var inputs = squatList[i].getElementsByTagName("input");
        squat[i] = [inputs[0].value, inputs[1].value]       

    }
    for (var i =0; i < deadliftList.length; i ++){
        var inputs = deadliftList[i].getElementsByTagName("input");
        deadlift[i] = [inputs[0].value, inputs[1].value]
    }
    

    dbData["date"] = date
    dbData["benchPress"] = benchPress
    dbData["squat"] = squat
    dbData["deadlift"] = deadlift

    var obj = JSON.stringify(dbData)
    console.log(obj)

    
}


function removeItem(itemName){
    var ul = document.getElementById("dynamic-list");
    var item = document.getElementById(itemName);
    ul.removeChild(itemName);
}


//------------------MQTT---------------