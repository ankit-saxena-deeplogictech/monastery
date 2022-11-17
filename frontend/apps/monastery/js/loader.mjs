/**
 * Not needed initially.
 */
const beforeLoading = async () =>{

    // // var divsToHide = document.querySelectorAll(".notspinner"); //divsToHide is an array
    // var divsToUnhide = document.querySelectorAll(".spinner");
    // console.log(divsToUnhide);
    // // var divsToHideLen = divsToHide.length;
    // var divsToUnhideLen = divsToUnhide.length;
    // // for(var i = 0; i < divsToHideLen; i++){
    // //     divsToHide[i].style.display = "none"; 
    // // }
    // for(var i = 0; i < divsToUnhideLen; i++){
    //     divsToUnhide[i].style.display = "block"; 
    // }
    if(!document.querySelector('.spinner')){
    const div= document.createElement('div');
    div.classList.add("spinner");
    div.innerHTML='<img class="loading-spinner" src="./img/loading_spinner.svg"/>';
    document.body.appendChild(div);}
}
/**
 * call after bindData function.
 */
const afterLoading = async () =>{
    // var divsToHide = document.querySelectorAll(".spinner"); //divsToHide is an array
    // // var divsToUnhide = document.querySelectorAll(".notspinner");
    // var divsToHideLen = divsToHide.length;
    // // var divsToUnhideLen = divsToUnhide.length;
    // // console.log("done");
    // for(var i = 0; i < divsToHideLen; i++){
    //     divsToHide[i].style.display = "none"; 
    // }
    // // for(var i = 0; i < divsToUnhideLen; i++){
    // //     divsToUnhide[i].style.display = "block"; 
    // // }
    // const div= document.createElement('div');
    // div.classList.add("spinner");
    // div.innerHTML='<img class="loading-spinner" src="./img/loading_spinner.svg"/>';
    // document.body.appendChild(div);
    const spinnerElement = document.querySelector('.spinner');
    console.log(spinnerElement);
    document.body.removeChild(spinnerElement);

}
export const loader = { beforeLoading, afterLoading}