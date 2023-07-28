//------Set up canvas begin---------
const canvasL = document.getElementById('canvasL');
const ctxL = canvasL.getContext('2d'); //determines the canvas to be 2D. 
const halfCanvasWidth = canvasL.width / 2; //half a canvas 
const halfCanvasHeight = canvasL.height / 2;
canvasL.height = canvasL.height - 50;

//--------------------------------------
//---------SET PARAMETERS BEGIN---------
//--------------------------------------
const secretCode = "CGFBB5IK"; //dont use I/L O/0 because they are hard to understand
let responseAcceptable = false;
let freshRate = 1000/60; // The delay the animation needs before beginning after the function is called

let startTrialTime; //The Date and time the trial starts
let endTrialTime; //the Date and time the trial ends

/* Retrives the browser the experiment is being displayed on */
function getBrowser() {
    const browsers = [
        { name: "Opera", keyword: "OPR" },
        { name: "Chrome", keyword: "Chrome" },
        { name: "Safari", keyword: "Safari" },
        { name: "Firefox", keyword: "Firefox" },
        { name: "IE", keyword: "MSIE" },
    ];

    for (const browser of browsers) {
        if (navigator.userAgent.indexOf(browser.keyword || browser.name) !== -1 ) {
            return browser.name;
        } else if (!!document.documentMode) {
            return "IE";
        }
    }
    return "Unknown";
 }

// ======================== GET AMAZON MTURK WORKER ID ======================= //
    // Get inferred subject ID from URL (credit to Eyal Peer)
    function getSubjectID() {
      let parampairs = window.location.search.substring(1).split('&');
      let foundId;
      for (i in parampairs) {
        let pair = parampairs[i].split("=");
        if (pair[0] === "PROLIFIC_PID") {
          foundId = pair[1];
        }
      }
      if (foundId){
        return foundId;
      } else {
        return "testSubject";
      }
    }
// ======================== CONVERT JSON TO CSV ======================= //
// https://codingbeautydev.com/blog/javascript-convert-json-to-csv/ //
function jsonToCsv(items) { // submit button may not be working if window.frame is null - please check
    const header = Object.keys(items[0]);
    const headerString = header.join(',');
  
    // handle null or undefined values here
    const replacer = (key, value) => value ?? '';
  
    const rowItems = items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
  
    // join header and body, and break into separate lines
    const csv = [headerString, ...rowItems].join('\r\n');
  
    return csv;
  }
function redirect() {
    // TODO: redirect elsewhere?
        window.location = "https://jhu.sona-systems.com/webstudy_credit.aspx?experiment_id=754&credit_token=2d6ab745370a4d0ba5567cdfdef69ee9&survey_code="+window.subjectID
}

// ======================== POST DATA TO SERVER ======================= //
function postData() {
    // Collect responses into JSON / csv file
    //   let dataString = JSON.stringify(window.frame);
      const csv = jsonToCsv(window.frame);

      // post response to server
      $.post("http://pclpsrescit2.services.brown.edu/blt_lab/mp-7/data/studysave.php", {
        fname: `${window.subjectID}.csv`,
        postresult_string: csv,  
      }).done(function(){
        $("#instructions").text(`Thank you! Your secret code is: ${secretCode}
        Please copy and paste this into your submission box! You may then close this window.`);
        $("#submitButton").hide();
      });
      $("#instructions").show();  
      $("#instructions").text("Thank you! Please wait while your secret code is being generated. This may take up to 5 minutes...");  
  }

let shapeAPrevTMP;
let shapeATestTMP;
let verticalTMPA;
let verticalTMPArray = [-50,+50]; // positions the balls at the bottom of the screen 

/* generates nrepetitions of different types of trials and pushes them to trialsList
location: the direction the disk moves in
congruence: whether it shows up in  the location it moved in or the opposite location
match type: whether the shape on the disk is the same or different
trial type: OSPB (two occluders, known location) / MODAL (one occluder that splits in two, unknown location)
*/
function trialGenerator(nRepetitions,trialsList) {
    //OSPB TRIALS (2 occluders from the start, location of moving disk is known to participant)
    for (let i = 0; i < nRepetitions; i++) { //top,congruent,match,OSPB
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "congruent", "match")      
    }
    for (let i = 0; i < nRepetitions; i++) { //top,congruent,new,OSPB
        setShape(2,5,1) //selects 3 shapes from 5 randomly, then replaces one of the original shapes with a new one
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "congruent", "new")
    }

    for (let i = 0; i < nRepetitions; i++) { //top,incongruent,match,OSPB
        setShape(1,5,0) 
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "incongruent", "match")
    }

    for (let i = 0; i < nRepetitions; i++) { //bottom,congruent,match,OSPB
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "congruent", "match")      
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,congruent,new,OSPB
        setShape(2,5,1) //selects 3 shapes from 5 randomly, then replaces one of the original shapes with a new one
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "congruent", "new")
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,incongruent,match,OSPB
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "incongruent", "match") 
    }

    //MODAL TRIALS (wonky movement- the location of the disks is unknown at the beginning, then the occluder splits in two)
    //congruence is set to null because there is no way to determine if the movement is congruent or not.
    for (let i = 0; i < nRepetitions; i++) { //top,incongruent,match,MODAL
        setShape(1,5,0) 
        setTMP()
        pushTrialInfo(trialsList, "MODAL", "top", null, "match")
    }
    for (let i = 0; i < nRepetitions; i++) { //top,,new,MODAL
        setShape(2,5,1)
        setTMP()
        pushTrialInfo(trialsList, "MODAL", "top", null, "new") 
    } 
    for (let i = 0; i < nRepetitions; i++) { //bottom,,match,MODAL
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "MODAL", "bottom", null, "match")      
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,,new,MODAL
        setShape(2,5,1) //selects 3 shapes from 5 randomly, then replaces one of the original shapes with a new one
        setTMP()
        pushTrialInfo(trialsList, "MODAL", "bottom", null, "new")
    }

    trialsList = shuffle(trialsList);
    return trialsList;
}

/* generates random numbers to create arrays. */
function generateRandomNumbers(count, limit) {
    let arr = [];
    while(arr.length < count) {
        let r = Math.floor(Math.random() * limit);
        if(arr.indexOf(r) === -1) arr.push(r); //javaScript checks by index so you can't use !(r in arr)
    }
    return arr;
}
/* sets shapes on the disks.*/
function setShape(count, limit, arrNumATest) {
    shapes = generateRandomNumbers(count, limit);
    shapeAPrevTMP = shapes[0];
    shapeATestTMP = shapes[arrNumATest];
}
/* sets the positions of disks at the bottom of the screen */
function setTMP() { 
        vertical = generateRandomNumbers(2, 2) 
        verticalTMPA = verticalTMPArray[vertical[0]];
    }
/* pushes info about each trial to the database. */
function pushTrialInfo(trialsList, trialType, diskLocation, spatioType, matchType) {
    trialsList.push({ //pushes info about each trial to the database
        "spatiotemporalType":spatioType,
        "trialType": trialType,
        "diskLocation": diskLocation,
        "matchType": matchType,
        "shapeAPreInd":shapeAPrevTMP,
        "shapeATestInd":shapeATestTMP,
        "ballAVertical":verticalTMPA,
        "responseC": "null",
        "browser": getBrowser(),
        "subjectID": getSubjectID(),
        "startTime": "null",
        "endTime": "null",
        "reactTime":"null",
    }); 
}

/* Fisher-Yates shuffle- used to shuffle trials so they appear random. */
function shuffle(o){
    for(let j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
}

/*
There are 51 * n total trials due to the three for loops each being run until the limit
of nRepetitions. This is to ensure there are the same number of each different
type of trial (match, new / congruent, incongruent / top, bottom). 
*/
let trialsInfo = []; //holds the information for the trials
const nRepetitions = 51; //number of each type (3) of trial = 51 * 3 = 153 trials
trialsInfo = trialGenerator(nRepetitions,trialsInfo); //generates the trials

let trialsInfoTraining = []; //holds info for training trials
const nRepetitionsTraining = 1; //number of each type (3) of trial = 51* 3 = 3 trials
trialsInfoTraining = trialGenerator(nRepetitionsTraining,trialsInfoTraining);
const subjectID = getSubjectID();

/* Disk properties are defined by Ball class and properties. */
class Ball {
    constructor(x, y, color, size) {
        this.x = x; //width
        this.y = y; //height
        this.color = color;
        this.size = size;
    }
    /* draws disks on the canvas. */
    drawBalls() {
        ctxL.beginPath();
        ctxL.strokeStyle = this.color;
        ctxL.lineWidth = 5;
        ctxL.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctxL.stroke();
    }
    /* updates position of a disk depending on which type of trial it is and where it is moving to. */
  
    updatePosition(trial, trialVal) {
        if ((trial[trialVal].trialType === "OSPB")) { //IF OSPB
            if (this.x < halfCanvasWidth) { //if x pos is left side
                this.x = this.x + velX;
                if (trial[trialVal].diskLocation === "bottom") { //if trial type is bottom
                    this.y = this.y + 1.6;
            }   else { //if trial type is top
                this.y = this.y - 1.1;
            }
        }   else { //if x pos is middle or right
                this.x = halfCanvasWidth;
        } 
        } else {
            //wonky mvmnt for MODAL
            if (this.x < halfCanvasWidth) {
                this.x = this.x + velX;
                if (this.x < AWidth + dotRadius / 4) {
                  this.y = this.y + 10;
                }
                if (AWidth + dotRadius / 4 <= this.x && this.x < AWidth + dotRadius / 2) {
                  this.y = this.y + 15;
                }
                if (AWidth + dotRadius / 2 <= this.x && this.x < AWidth + 1.5 * dotRadius) {
                  this.y = this.y - 3;
                }
                if (AWidth + 1.5 * dotRadius <= this.x && this.x < AWidth + 2 * dotRadius) {
                  this.y = this.y;
                }
                if (AWidth + 2 * dotRadius <= this.x && this.x < AWidth + 3 * dotRadius) {
                  this.y = this.y - 3;
                }
                if (AWidth + 3 * dotRadius <= this.x && this.x < halfCanvasWidth) {
                  this.y = halfCanvasHeight - 100;
                }
              } else {
                this.x = halfCanvasWidth;
                this.y = halfCanvasHeight - 55;
              }
        }
    };

    updateCongruence(trial, trialVal) {
        return new Promise((resolve) => {
            if (trial[trialVal].trialType === "OSPB"){
                if (trial[trialVal].spatiotemporalType === "incongruent") { //if trial type is incongruent
                    if (trial[trialVal].diskLocation === "bottom") { //if trial type is bottom
                        this.y = 93; //set top
                    } else {
                    this.y = 233; //set bottom
                    }
                }  
            } else {
                if (trial[trialVal].diskLocation ==="bottom") {
                    this.y = halfCanvasHeight - 55;
                } else {
                    this.y = halfCanvasHeight - 175;
                }
            }
            // Resolve the Promise once the asynchronous task is completed
            resolve();
          });
    };
}

/* Occluder properties defined by the occluder class */
class Occluder {
    constructor(height, y) {
        this.width = 100; //width -> always the same
        this.height = height;//height
        this.x = halfCanvasWidth - 50;//x coord of upper left corner -> always the same
        this. y = y; //y coord of upper left corner 
        this.color = "black";
    }

    /* Draws occluders with the given specifications on the screen. */
    drawOccluder() {
        ctxL.beginPath();
        ctxL.fillStyle = this.color;
        ctxL.fillRect(this.x, this.y, this.width, this.height);
    }

    /* moves top occluder up offscreen and bottom occluder down offscreen*/
    updatePosition() {
        if (this.y < 51) { //51 is the pos of the top occluder
            this.y = this.y - (9 * velY);
        } else {
            this.y = this.y + (9* velY);
        }
    }
};

const nDots = 1; 
const dotRadius = 40; //Radius of each dot in pixels
let AWidth = halfCanvasWidth - 230;
let AHeight =  halfCanvasHeight - 125;

let velX = 4.5;
let velY = 1.5;
let edgeX = 100;
//experiment procedures
function showInstructions() {
    $('#consent').hide();
    $('#Instruction1').show();
    $('#continueInstructionButton1').show();
}
function continueInstruction1() {
    $('#Instruction1').hide();
    $('#continueInstructionButton1').hide();
    $('#Instruction2').show(); 
    $('#startTrainingButton').show();
}
/* 
Displays instructions based on the section of training or testing. 
*/
function instructions(instFirst, instSecond, button, type) {
    responseAcceptable = false
    if (type === 'd') {
        curTrial++;
    }
    $(instFirst).hide();
    $(instSecond).hide();

    switch (type) {
        case 'a' || 'c':
            $(button).hide();
        case 'a':
            $('#InstructionPractice').show();
        case 'b':
            trainingTrial++;
    }
}

let ballA;
/* helper used to define properties of a disk. */
function generateNewBallsHelper(x, y) {
    let ballA = new Ball(
        x,
        y,
        "white",
        dotRadius,
    );
    return ballA;
}

let occluderA;
let occluderB;
let occluderC;
let occluderD;
let occluderE;
/* Helper used to create new occluders.*/
function generateNewOccluder(height, y) {
    let occluder = new Occluder(
        height,
        y
    )
    return occluder;
}
/* 
Styles the screen based on if the experiment is in the training session or the
 test section.
*/
function style(type, trial, trialVal) {
    if (type !== 'a') {
        ctxL.fillStyle = 'gray';
        ctxL.clearRect(0,0,canvasL.width, canvasL.height)
    } 
    if (type !== 'a' || 'b') {
        startTrialTime = new Date();
        trialsInfo[curTrial].startTime = startTrialTime;
    }
    
    if (type === 'b') {
            $('#Instruction2').hide();
    }
    $('#canvasL').show();
    if (trial[trialVal].trialType === "OSPB") {
        //draw 2 occluders
        occluderA = generateNewOccluder(100, halfCanvasHeight-225)
        occluderB = generateNewOccluder(100, halfCanvasHeight-100)
        occluderA.drawOccluder()
        occluderB.drawOccluder()
    } else {
        occluderD = generateNewOccluder(100, halfCanvasHeight-225)
        occluderE = generateNewOccluder(100, halfCanvasHeight-100)
        occluderC = generateNewOccluder(225, halfCanvasHeight-225)
        occluderC.drawOccluder()
    }
    ballA.drawBalls();
   
    stimuliPreview(trial, trialVal); 
}

let trainingTrial = 0;
let curTrial = 0;
/* shows a portion of either the training or test trials and instructions depending on which part of the experiment is being run. */
function showTrials(type) {
    switch (type) {
        case 'a':
            instructions('#title', '#Instruction2', '#startTrainingButton', 'a')
            ballA = generateNewBallsHelper(AWidth, AHeight);
            style('a', trialsInfoTraining, trainingTrial)
            break;

        case 'b':
            instructions('#Instruction4', '#nextTrainingTrialButton', null, 'b')
    
            if (trainingTrial < trialsInfoTraining.length) {
                ballA = generateNewBallsHelper(AWidth, AHeight);
                style('b', trialsInfoTraining, trainingTrial)
            } else {
                $('#InstructionPractice').hide();
                $('#Instruction3').show();
                $('#startExpButton').show();
            }
            break;

        case 'c':
            instructions('#title', '#Instruction3', '#startExpButton', 'c')
            ballA = generateNewBallsHelper(AWidth, AHeight);
            style('c', trialsInfo, curTrial)
            break;

        case 'd':
            instructions('#Instruction4', '#nextTrialButton', null, 'd')

            if (curTrial < trialsInfo.length) {
                ballA = generateNewBallsHelper(AWidth, AHeight);
                style('d', trialsInfo, curTrial)
            } else {
                $('#Instruction5').show();
                $('#submitButton').show();
            }
            break;
        }
}

let myTimeout10;
let myTimeout11;
let myTimeout12;
let shapeIndAPre;
let shapeIndATest;
let shapeIndBPre;
const colorDisk = 500; 
const previewShape = 1200; //length the shapes appear for each trial in milliseconds

async function stimuliPreview(trial, trialVal) { // the phases before the disks and shapes move
    await new Promise((resolve) => {
    myTimeout10 = setTimeout(function () {
        if (trainingTrial <= trialsInfoTraining.length - 1) {
          shapeIndAPre = trialsInfoTraining[trainingTrial].shapeAPreInd;
        }
        if (trainingTrial === trialsInfoTraining.length && curTrial >= 0) {
          shapeIndAPre = trialsInfo[curTrial].shapeAPreInd;
        }
        shapeTmp = animationHelper(shapeIndAPre);
        ctxL.drawImage(shapeTmp, ballA.x - 27, ballA.y - 27);
        shapeTmp = animationHelper(shapeIndBPre);
  
        myTimeout11 = setTimeout(function () {
          ballA.drawBalls();
  
          myTimeout12 = setTimeout(function () {
            animate(trial, trialVal);
            resolve(); // Resolve the promise to indicate that this iteration of stimuliPreview is complete.
          }, colorDisk);
        }, previewShape);
      }, colorDisk);
    });
  }
let refresh = 0; //DO NOT make these const - even though they don't change it causes the occluder to disappear
let myTimeout;
let myReq;
let startResponseTiming = false;



function animate(trial, trialVal) { // make the disks and the shapes move together and occluders move off screen 
    myTimeout = setTimeout (async function() {     
    ctxL.fillStyle = 'gray';
    ctxL.clearRect(0,0,canvasL.width, canvasL.height);
    
if (trainingTrial < trialsInfoTraining.length) {
    verticalTMPA = trialsInfoTraining[trainingTrial].ballAVertical;
}
if (trainingTrial === trialsInfoTraining.length && curTrial < trialsInfo.length) {
    verticalTMPA = trialsInfo[curTrial].ballAVertical;
}
    ballA.drawBalls();
    ballA.updatePosition(trial, trialVal);
    refresh ++;
    
    if (refresh < 76) {
        //keeps occluders on screen while disk moves
        if (trial[trialVal].trialType === "OSPB") {
            occluderA.drawOccluder()
            occluderB.drawOccluder()
        } else {
            occluderC.drawOccluder()
        }
        myReq = requestAnimationFrame(() => animate(trial, trialVal));
    
    } else { //after this period, occluder becomes two occluders (MODAL) then move offscreen (OSPB + MODAL)
            // moves top one up, bottom one down
            await ballA.updateCongruence(trial, trialVal);

            if (trial[trialVal].trialType === "OSPB"){
                occluderA.drawOccluder();
                occluderB.drawOccluder();
                occluderA.updatePosition();
                occluderB.updatePosition();
        } else {
                occluderD.drawOccluder();
                occluderE.drawOccluder();
                setTimeout(function () {
                    occluderD.updatePosition();
                    occluderE.updatePosition();
                  }, 500);
                
        }
       if (trainingTrial < trialsInfoTraining.length) {
            shapeIndATest = trialsInfoTraining[trainingTrial].shapeATestInd;
        }

        if (trainingTrial >= trialsInfoTraining.length && curTrial >=0) {
            shapeIndATest = trialsInfo[curTrial].shapeATestInd;
        }
        shapeTmpA = animationHelper(shapeIndATest)
        shapeAppearance(trial, trialVal)

         if (refresh === 150) { 
            responseAcceptable = true; // only allow response when the occluder is removed/equivalent time in no occluder condition
        }  else {
            myReq = requestAnimationFrame(() => animate(trial, trialVal));
            }
    }  
    }, freshRate) 
}
/* allows shapes to appear as soon as the occluder no longer covers them */
function shapeAppearance(trial, trialVal) {
    if (trial[trialVal].trialType === "OSPB") { //if the trial is OSPB
        if ((trial[trialVal].diskLocation === "top" && trial[trialVal].spatiotemporalType === "congruent") ||
         (trial[trialVal].diskLocation === "bottom" && trial[trialVal].spatiotemporalType === "incongruent")) { //if the disk should be at the top of the screen after it goes behind the occluder
            //if top occluder above circle show image
            if (occluderA.y + 120 < ballA.y) {
                ctxL.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                responseAcceptable = true;
            }
        } else {
            if (occluderB.y > ballA.y + 20) {
                ctxL.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                responseAcceptable = true;
            }
        }
    } else { //if MODAL
        if (trial[trialVal].diskLocation === "top") {
            if (occluderD.y + 120 < ballA.y) {
                ctxL.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                responseAcceptable = true;
            }
        } else {
            if (occluderE.y > ballA.y + 20) {
                ctxL.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                responseAcceptable = true;
            }
        }
    }
}
/* 
Given value, chooses which of 5 shapes to display.
JS passes by value not reference so you can't assign values to a variable by passing it as a parameter.
*/
function animationHelper(shapeTest) {
    let shapeTMP;
    switch (shapeTest) {
      case 0:
        shapeTMP = document.getElementById("shape0");
        break;
      case 1:
        shapeTMP = document.getElementById("shape1");
        break;
      case 2:
        shapeTMP = document.getElementById("shape2");
        break;
      case 3:
        shapeTMP = document.getElementById("shape3");
        break;
      case 4:
        shapeTMP = document.getElementById("shape4");
        break;
    }
    return shapeTMP;
  }

// record keyboard response
window.addEventListener('keydown', function(e) {
if (responseAcceptable === true) {
    if (e.key === '1' || e.key === '2') {
        endTrialTime = new Date();
        window.cancelAnimationFrame(myReq);
        clearTimeout(myTimeout);
        refresh = 0;
        $('#canvasL').hide();
        $('#Instruction4').show();
        if (trainingTrial <= trialsInfoTraining.length-1) {
            $('#nextTrainingTrialButton').show();
        } 
        if (trainingTrial === trialsInfoTraining.length && curTrial>=0) {
            $('#nextTrialButton').show();
        }
        ballA.x = halfCanvasWidth-230;
        ballA.y = halfCanvasHeight;
        
        trialsInfo[curTrial].endTime = endTrialTime;
        trialsInfo[curTrial].reactTime = endTrialTime - startTrialTime-colorDisk-previewShape-colorDisk-76*20;    
    }
    if (e.key === '1') {
        trialsInfo[curTrial].responseC = 1; 
    }
    if (e.key === '2') {
        trialsInfo[curTrial].responseC = 0;  
    }
}           
}, false);
// save json file to local device
function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
};

/* wait for clicks */
// Testing data posting
$('#consented').click(showInstructions);
$('#continueInstructionButton1').click(continueInstruction1);
$('#startTrainingButton').click(function() {
    showTrials('a');
});
$('#nextTrainingTrialButton').click(function() {
    showTrials('b');});
$('#startExpButton').click(function() {
    showTrials('c');});
$('#nextTrialButton').click(function() {
    showTrials('d');});
$('#submitButton').attr("onclick", "postData()");