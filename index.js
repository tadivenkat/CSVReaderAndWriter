require('dotenv-flow').config();
const axios = require('axios');
const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: process.env.outputFile,
    header: [
        {id: 'description', title: 'Description'},
        {id: 'id', title: 'Id'},
        {id: 'title', title: 'Title'}
    ]
});
const data = [];
const newData = [];

const getNewData = (data) => {
    return new Promise(async (resolve, reject) => {
        let countOfRowsInserted = 0;
        let countOfRowsFailed = 0;
        data.forEach(async (item, index) => {
            axios
                .get(process.env.url.replace(':id', item.id), {
                    headers: {
                    'Authorization': `Bearer ${process.env.token}`,
                    'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    item.title = response.data.title;
                    newData.push(item);
                    countOfRowsInserted++;
                    if (countOfRowsInserted + countOfRowsFailed === data.length) {
                        resolve(newData);
                    }
                })
                .catch(error => {
                    console.log(error);
                    countOfRowsFailed++;
                });
        });

    });
  }

fs.createReadStream(process.env.inputFile)
  .pipe(csvParser())
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', async() => {
    console.log("input data", data);
    getNewData(data).then(response => {
        console.log("output data", newData);
        csvWriter.writeRecords(newData).then(() => {
            console.log('The CSV file was written successfully');
        });
    });
  });