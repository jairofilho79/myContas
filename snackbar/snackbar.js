function Snackbar(msg,clas) {
    if(msg !== undefined) {
        const body = document.getElementById("snackbar");
        let c = clas === undefined || clas === "" ? "default" : clas;
        body.innerHTML = `<div class="snackbar show sb-${c}">${msg}</div>`;

        const bar = document.getElementsByClassName("snackbar")[document.getElementsByClassName("snackbar").length-1];
        setTimeout(function(){ bar.className = bar.className.replace("show", "");},3000);
    }
}