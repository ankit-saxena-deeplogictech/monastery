/**
 * Not needed initially.
 */
const beforeLoading = async () =>{
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
    if(document.querySelector('.spinner')){

    const spinnerElement = document.querySelector('.spinner');
    document.body.removeChild(spinnerElement);
    }
}
export const loader = { beforeLoading, afterLoading}