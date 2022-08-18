const fs = require("fs");
const vcfParser = require("vcftojson");
const utf8 = require("utf8");
const qtParser = require("quoted-printable");

//reading and processing vcf and json files.
const vcfContent = readFile("./data/contacts2.vcf");
vfcToJson(vcfContent, jsonContent => {
    //json file is now created
    console.log(
        "initialization is now successfully done , going for the actual operation"
    );

    //getting the name of people , in the namesList array
    let namesObjectList = jsonContent.filter(
        content => content.vcfLine.split(";")[0] === "FN"
    );
    let namesList = namesObjectList.map(nameObject => {
        let tempName = nameObject.vcfLine.split(":")[1];

        //check if there is any unrecongnized charachter in the string
        if (tempName.split("=D9=")[tempName.split("=D9=").length - 1] == "") {
            let correctName = "";
            for (
                let counter = 0;
                counter < tempName.split("=D9=").length - 1;
                counter++
            ) {
                correctName += tempName.split("=D9=")[counter];
                if (counter != tempName.split("=D9=").length - 2) {
                    correctName += "=D9=";
                }
            }
            return correctName;
        } else {
            return tempName;
        }
    });

    //getting the numbers of people , in the numbers List array
    let numbersObjectList = jsonContent.filter(
        content => content.vcfLine.split(";")[0] === "TEL"
    );
    let numbersList = numbersObjectList.map(numberObject => {
        return numberObject.vcfLine.split(":")[1];
    });

    let contactsList = [];
    //checking the amount of names and numbers (they arent always the same amount)
    //decoding data
    //checking if data id corrupted
    if (namesList.length >= numbersList.length) {
        for (let counter in namesList) {
            contactsList[counter] = {
                name: namesList[counter]
                    ? utf8.decode(qtParser.decode(namesList[counter])).trim()
                    : "خطا در شناسایی نام",
                tell: numbersList[counter]
                    ? numbersList[counter]
                    : "خطا در شناسایی شماره"
            };
        }
    } else {
        for (let counter in numbersList) {
            contactsList[counter] = {
                name: namesList[counter]
                    ? utf8.decode(qtParser.decode(namesList[counter])).trim()
                    : "خطا در شناسایی نام",
                tell: numbersList[counter]
                    ? numbersList[counter]
                    : "خطا در شناسایی شماره"
            };
        }
    }

    //writing the final data to a json file , beside to the actual data that we have
    //this data is an array list of names and their corresponding phone numbers
    writeFile("./data/results2.json", JSON.stringify(contactsList));

    //sorting data
    contactsList.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    //writing data to a final .txt file for printing
    writeForPrint(contactsList);
});

//read the demanded file
function readFile(path) {
    return fs.readFileSync(path, {
        encoding: "utf-8"
    });
}

//write the demanded file
function writeFile(path, data) {
    fs.writeFileSync(path, data);
    console.log(`file ${path} was successfully written`);
    return data;
}

//edit file data
function editFile(path, data) {
    fs.appendFileSync(path, data);
}

//converting vcf data to json
async function vfcToJson(content, callback) {
    const jsonContent = await vcfParser.vcfToJSON(content);
    writeFile("./data/contacts2.json", JSON.stringify(jsonContent));
    callback(jsonContent);
}

//handling creation of the last final file for printing
function writeForPrint(data) {
    //creating an empty file , next operations will be editing
    writeFile("./data/contacts2.txt", "");

    //making a headline for first repeated characters
    let lastHeadline = "";
    //initializing an independent counter for document increment
    let innerCounter = 0;
    for (let counter in data) {
        if (lastHeadline == data[counter].name[0]) {
            //normal lines
            editFile(
                "./data/contacts2.txt",
                `ردیف : ${innerCounter + 1} | نام : ${
                    data[counter].name
                } | تلفن : ${data[counter].tell}
-----------------------------------------------------------
`
            );
        } else {
            //headlines

            //managing displaying of the headline character
            lastHeadline = data[counter].name[0];
            let numberOfHeadLines = data.filter(item => {
                if (item.name[0] == lastHeadline) {
                    return true;
                }
            }).length;
            editFile(
                "./data/contacts2.txt",
                `-->> ${lastHeadline} <<-- 
مخاطب یافت شد ${numberOfHeadLines} 
ردیف : ${innerCounter + 1} | نام : ${data[counter].name} | تلفن : ${
                    data[counter].tell
                }
-----------------------------------------------------------
`
            );
        }
        // independednt counter state management
        innerCounter++;
    }

    //final words of wisdom
    console.log("final file is now ready !");
}
