/**
 * Company: Haug und Partner
 * Programmer: Fabian Grießbach
 * created: 19.12.2023
 */

let langSwitcherReady = false; 
const localStorageVar = "hup-lang-switcher-current";
const updateControlBtnsClass = "custom-languageSwitch-btn";
//set to true to get informations in the console, set to false if you dant wnat console logs
let devDebugLangSwitcher = false;

function sendPostMessage(sentby, message){
    class m {
        constructor(sentby, message){
            this.sentby = sentby; 
            this.message = message; 
        }
    }
    const md = JSON.stringify(new m(sentby, message)); 
    const or = window.location.origin; 
    window.postMessage(md, or); 
}

function recivPostMessage(sentby, callback){
    window.addEventListener('message', (event)=>{
        if(event.origin == this.origin){
            let d = JSON.parse(event.data); 
            if(d.sentby == sentby){
                callback(d.message);
            }
        }
    })
}

//proxy
let langData = new Proxy([], {
    get(target, prop){
        if(prop in target){
            return target[prop]
        } else {
            return 0; 
        }
    },
    set(target, prop, val){
        target[prop] = val; 
        //sends message if the proxy was changed
        sendPostMessage('langData', 'changed')
        return true; 
    }
});

let componentsCount = new Proxy([0], {
    get(target, prop) {
        return Reflect.get(target, prop);
    },
    set(target, prop, val) {
        target[prop] = val;
        sendPostMessage('compCounter', val);
        return true; // Indicate success
    }
});

recivPostMessage('langData', function (md){
    if(devDebugLangSwitcher === true){
        console.log(langData)
    }
})



//widget is the class wich should be contained in the class list of the element selected with the targetID
//lowest is the lowest class wich is in the element, the children of this element will change
const elementorSelectorData = [
    {
        widget: "elementor-widget-text-editor",
        lowest: "elementor-widget-container"
    },
    {
        widget: "elementor-widget-heading",
        lowest: "elementor-heading-title"
    },
    {
        widget: "elementor-widget-button",
        lowest: "elementor-button-text"
    },
    {
        widget: "menu-item",
        lowest: "hfe-menu-item"
    }
];

//this classes are in the classlist of the element wich is selected with the targetID, 
//when one of this classes can befound the script knows that the traget is deeper nested and uses the elementorSelectorData array to finde the target Element
const TargetEclassPrefix = ["elementor-widget-", "menu-item"];  

class langD {
    constructor(currentE,targetID, lang, text){
        this.currentE = currentE; 
        this.targetID = targetID; 
        this.lang = lang;
        this.text = text;  
    }
}

// custom element
customElements.define('language-data', class languageData extends HTMLElement{
    constructor(){
        super();
        this.shadow = this.attachShadow({mode:"open"}); 
        const styleE = document.createElement('style'); 
        styleE.innerHTML = `
            :host{
                display: none; 
            }
        `
        this.shadow.append(styleE); 
        this.defaultLang = this.hasAttribute('default-lang') ? this.getAttribute('default-lang') : 'de'; 
        this.targetID = this.hasAttribute('target-id') ? this.getAttribute('target-id') : false; 
        this.cDataId = "language-target-id";  
    }

    generateID(prefix,l){
        const letters = "1234567890qwertzuioplkjhgfdsayxcvbnmWERTZUIOPLKJHGFDSAYXCVBNM"; 
        let res = prefix;
        for(let i = 0; i < l; i++){
            res += letters[Math.floor(Math.random() * (letters.length - 1))]; 
        }
        return res; 
    }

    setTargetEId(taregtID, setCId){
        if(taregtID == false) return; 
        if(document.body.contains(document.querySelector(`#${taregtID}`)) == false) return; 
        const idE = document.querySelector(`#${taregtID}`);
        //classPrefix should select only one class  
        const idEClasses = idE.hasAttribute('class')? idE.getAttribute('class').split(' ') : [];
        let elementorClasses = idEClasses.filter(f => {
            if(TargetEclassPrefix.some(prefix => f.includes(prefix))) return f;
        });
        //is elemntor element?
        if(elementorClasses.length > 0){
            //elementor element
           const widgetData = elementorSelectorData.find(c => c.widget === elementorClasses[0]); //should contain only one element, because of the elementor class structure
           if(!widgetData) return; //if the widget cant be found in data
           if(!widgetData.lowest) return; 
           if(!idE.contains(idE.querySelector(`.${widgetData.lowest}`))) return; 
           //set custom id attr to element
           idE.querySelector(`.${widgetData.lowest}`).setAttribute(this.cDataId, setCId); 
        } else {
            //no elementor element
            idE.setAttribute(this.cDataId, setCId); 
        }
    }

    getDefaultData(cId){
        const cIdE = document.querySelector(`[${this.cDataId}="${cId}"]`); 
        const childEs = Array.from(cIdE.children); 
        let res = []; 
        if(childEs.length !== 0){
            //has multiple children
            childEs.forEach(e=>{
                const cloneE = e.cloneNode(true); 
                res.push(cloneE); 
            })
        } else {
            //has only text as child
            res.push(cIdE.textContent); 
        }
        return res; 
    }

    setChildData(cId, CurentTargetE){
        const childrenEs = this.querySelectorAll('language-data-lang'); 
        if(childrenEs.length < 0) return; 
        childrenEs.forEach(e=>{
            if(!e.hasAttribute('lang-name')) return; 
            const CLang =  e.getAttribute('lang-name'); 
            const childEs = e.children; 
            let content = [];
            if(childEs.length !== 0){
                //forEach needed for cloning all childs
                Array.from(childEs).forEach(c=>{
                    const cloneE = c.cloneNode(true); 
                    content.push(cloneE); 
                })
            } else {
                content.push(e.textContent)
            }
            //update langData
            langData.push(new langD(CurentTargetE,cId, CLang, content));
        });  
    }

    connectedCallback(){
        componentsCount[0] += 1; 
        const targetCID = this.generateID('hup-langswitcher-', 30); 
        //set id to the lowest element, is used for future selection 
        this.setTargetEId(this.targetID, targetCID);
        if(!document.body.contains(document.querySelector(`[${this.cDataId}="${targetCID}"]`))) {
            this.remove(); 
            return; 
        }; 
        const CurentTargetE = document.querySelector(`[${this.cDataId}="${targetCID}"]`); 
        const defaultContent = this.getDefaultData(targetCID); 
        if(!defaultContent) {
            this.remove(); 
            return; 
        } 
        //component default 
        langData.push(new langD(CurentTargetE,targetCID, this.defaultLang, defaultContent));
        this.setChildData(targetCID, CurentTargetE);
        //remove language-data element from document
        this.remove(); 
    }
    disconnectedCallback(){
        setTimeout(()=>{
            componentsCount[0] -= 1;
            if(devDebugLangSwitcher === true) {
                console.groupCollapsed('Removed');
                console.log(this);
                console.log(`Component count: ${componentsCount[0]}`)
                console.groupEnd(); 
            }
        },1)
    }
})

function updatePageContent(){
    if(!langSwitcherReady) return; 
    if(!window.localStorage.getItem(localStorageVar)) return; 
    const currentLang = window.localStorage.getItem(localStorageVar); 
    const langContent = langData.filter(l=> l.lang === currentLang);
    if(langContent.length === 0) return;  
    langContent.forEach(e=>{
        const targetE = document.querySelector(`[language-target-id="${e.targetID}"]`);
        if(e.text[0] instanceof HTMLElement){
            //the element is an HTMLElement
            targetE.innerHTML = ""; 
            e.text.forEach(t=>{
                targetE.append(t) 
            })
        } else{
            //the element is not an HTMLElement
            targetE.innerHTML = ""; 
            e.text.forEach(t=>{
                targetE.innerHTML += t; 
            })
        }
    })
}

function updateControlBtns(buttonC){
    if(!langSwitcherReady) return; 
    if(!window.localStorage.getItem(localStorageVar)) return; 
    if(!document.body.contains(document.querySelector(`.${buttonC}`))) return; 
    const currentLang = window.localStorage.getItem(localStorageVar);
    const btnEs = document.querySelectorAll(`.${buttonC}`);  
    btnEs.forEach(e=>{
        if(!e.hasAttribute('data-lang')) return; 
        const btnLang = e.getAttribute('data-lang');
        e.classList.remove('active'); 
        if(btnLang === currentLang) e.classList.add('active'); 
    })
}

function debugSwitscherTable(data){
    let currentD = [];
    for(let i = 0; i < (data.length - 1); i++ ){
        if(i > 1000) return; 
        currentD.push(data[i]); 
    }
    console.table(currentD) 
}

//reciver
recivPostMessage('compCounter', function (md){
    if(md == 0) {
        //update readystate 
        langSwitcherReady = true;
        //update the page if the local strorage has already a value
        updatePageContent();
        updateControlBtns(updateControlBtnsClass);
        if(devDebugLangSwitcher === true) {
            console.log('LangSwitcher is Ready');
            debugSwitscherTable(langData)       
        }
    }
})


recivPostMessage('changeLangTo', function (md){
    if(!langSwitcherReady) return; 
    if(devDebugLangSwitcher === true) console.log(md);
    updatePageContent();
    updateControlBtns(updateControlBtnsClass); 
})


//btn event 
function changeLangTo(lang){
    if(!langSwitcherReady) return; 
    window.localStorage.setItem(localStorageVar, lang); 
    sendPostMessage('changeLangTo', lang);
}

//this function is for fast debuging with the browser console
var hup_LangSwitcher_fastDebug = (lang) =>{
    console.group('LangSwitcher_fastDebug')
    devDebugLangSwitcher = true; 
    sendPostMessage('langData', 'changed');
    sendPostMessage('compCounter', 'test');
    console.log(`Switcher Ready: ${langSwitcherReady}`); 
    debugSwitscherTable(langData);
    if(lang){
        changeLangTo(lang);
    }
    //update page 
    updatePageContent();
    updateControlBtns(updateControlBtnsClass); 
    if(lang == "clear") window.localStorage.removeItem(localStorageVar); 
    setTimeout(()=>{
        devDebugLangSwitcher = false; 
        console.groupEnd()
    },100);
}

//set styling classes
function SetUpdateControlBtnsDeviderClass(btnsC){
    if(!document.body.contains(document.querySelector(`.${btnsC}`))) return;
    const tragtEs = document.querySelectorAll(`.${btnsC}`); 
    const deviderC = `${btnsC}-devider`;
    for(let i = 0; i < (tragtEs.length - 1); i++){
       if(devDebugLangSwitcher) console.log(tragtEs[i]);
       tragtEs[i].classList.add(deviderC);
    }
}

SetUpdateControlBtnsDeviderClass(updateControlBtnsClass);
