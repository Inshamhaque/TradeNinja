// for file parsing utilities

const fs = require("fs")

function ldf(path){
    try{
        return fs.readFileSync(path, 'utf-8')
    }
    catch(e){
        console.error("Error loading the file")
        process.exit(1)
    }
}

function prs(csv){
    const lns = csv.trim().split('\n');
    const dat = []
    for(let i=0;i<lns.length;i++){
        const pts = lns[i].split(',');
        if (pts.length >= 2) {
        dat.push({ dte: pts[0].trim(), cls: parseFloat(pts[1]) });
        }
    }
    if (dat.length === 0) {
        console.error('Error: No valid data found in CSV');
        process.exit(1);
    }
    return dat;
}