/**
 * Company: Haug und Partner
 * Programmed from: Fabian Grießbach
 * created: 22.08.2023
 */
/**
 *  <hup-swiper id="sw1" config-data="">

    </hup-swiper>
 */
customElements.define('hup-swiper', class hupSwiper extends HTMLElement {
    static get observedAttributes() {
        return ['config-data', 'navi-input'];
    }
    constructor() {
        super();
        this.config = false;
        this.slidesData = false;
        this.swiperPos = false;
        this.slideV = false;
        this.SwiperW;

        this.style.position = "relative";
        this.style.display = "block";
        this.style.overflow = "hidden";
    }

    Isloop() {
        if ("loop" in this.config && this.config.loop == true) {
            return true;
        } else {
            return false;
        }
    }

    getConftigData(blobUrl, passesFunction) {
        fetch(blobUrl)
            .then(response => response.json())
            .then(res => {
                passesFunction(res);
            })
    }

    setSwiperHeight(slidesData) {
        let maxHeight = Math.round(Math.max(...slidesData.map(e => {
            return e.height
        })));
        this.style.height = `${maxHeight}px`;
    }

    calcSwiperPos(slidesData, swiperData) {
        //slides y values 
        const cStyle = window.getComputedStyle(this);
        const SwiperW = Number(cStyle.width.replace('px', ''));
        this.SwiperW = SwiperW;
        const CardsW = Math.round(Math.max(...slidesData.map(e => {
            return e.width;
        })));
        const displayPosible = (swData, SwiperW, CardsW) => {
            let vCount = (swData.slides) ? swData.slides : 3;
            let gap = (swData.gap) ? swData.gap : 50;
            let VisebleWidth = (vCount * gap) + (CardsW * vCount);
            return (SwiperW - VisebleWidth > 0) ? true : false;
        }
        const posibleSlideCount = () => {
            //console.log('active')
            let gap = swiperData.gap ? swiperData.gap : 50;
            let slidesC = Math.floor(SwiperW / (CardsW + gap));
            //console.log(slidesC)
            return slidesC;
        }

        this.slideV = Math.round(SwiperW / swiperData.slides);

        if (displayPosible(swiperData, SwiperW, CardsW) == false) {
            this.slideV = Math.round(SwiperW / posibleSlideCount());
        }
        // hier fehlt noch was das sind nur grobe werte die gap ist noch nicht mit ein bedacht 
        const outputData = slidesData.map((e, i) => {
            let PosX = i * this.slideV;
            //if("loop" in this.config && this.config.loop == true) 
            if (this.Isloop() == true) {
                PosX -= this.slideV;
            }
            //PosX += swiperData.gap ? swiperData.gap : 50;
            return { slide: e.slide, PosX: PosX, EStatus: false }
        });

        return outputData;

    }

    transformElementTo(targetE, poistion, swiperData, elementObj) {
        let prevDisplay = window.getComputedStyle(targetE).display;
        if (elementObj.EStatus == true) {
            targetE.style.display = "none"
        }
        let CurrentAv = targetE.animate([
            { transform: `translateX(${poistion}px)` }
        ],
            {
                fill: "forwards",
                duration: (swiperData.speed) ? swiperData.speed : 300,
            }
        );

        CurrentAv.finished.then(() => {
            if (elementObj.EStatus == true) {
                targetE.style.display = prevDisplay;
                elementObj.EStatus = false;
            }
        });
    }

    slideDefault(slidesData, data) {
        slidesData.forEach(e => {
            let targetE = e.slide;
            targetE.style.position = "absolute";
            this.transformElementTo(targetE, e.PosX, data, e);
        })
    }


    createSlidesData() {
        let slides = this.children;
        const SlidesData = Array.from(slides).map((e, i) => {
            let cStyle = window.getComputedStyle(e);
            let eWidth = Number(cStyle.width.replace('px', '')) + Number(cStyle.paddingLeft.replace('px', '')) + Number(cStyle.paddingRight.replace('px', ''));
            let eHeight = Number(cStyle.height.replace('px', '')) + Number(cStyle.paddingTop.replace('px', '')) + Number(cStyle.paddingBottom.replace('px', ''));
            let eStatus = (e.classList.contains('active')) ? true : false;
            return { slide: e, index: i, width: eWidth, height: eHeight, status: eStatus };
        });
        return SlidesData;
    }

    setup(data) {
        //console.log(data)
        this.config = data;
        this.swiperPos = this.calcSwiperPos(this.slidesData, data);
        //console.log(this.swiperPos)
        this.slideDefault(this.swiperPos, data);
        //this.upadateSliePos(this.slidesData[1].slide,data, this.swiperPos); 

    }

    SwiperLoop(swiperPos, sildeW, swiperW) {
        //let SwiperL = swiperPos.length; 
        //console.log(swiperPos)
        let maxPosX = Math.max(...swiperPos.map(e => {
            return e.PosX;
        }));
        let minPosX = Math.min(...swiperPos.map(e => {
            return e.PosX;
        }))
        swiperPos.forEach(e => {
            if (e.PosX < sildeW * -1) {
                e.PosX = maxPosX + sildeW;
                e.EStatus = true;
            }
        })
        if (minPosX >= 0) {
            let maxE = swiperPos.find(e => e.PosX == maxPosX);
            maxE.PosX = sildeW * -1;
            maxE.EStatus = true;
        }
    }

    slideTo(oldIndex, newIndex, swiperPos, data) {
        if (!isNaN(oldIndex)) {
            let difference = Math.abs(oldIndex - newIndex);
            let maxIndex = swiperPos.length - 1;
            let [subStatus, addStatus] = [true, true];
            if (this.Isloop() == false) {
                [subStatus, addStatus] = [
                    (newIndex <= maxIndex) ? true : false,
                    (newIndex >= 0) ? true : false
                ]
            }

            if (newIndex !== difference && difference >= 0) {
                //console.log( `old: ${oldIndex}, new: ${newIndex} diffrenece: ${difference}`)

                let sub = Math.round(difference * this.slideV);
                swiperPos.forEach(e => {
                    if (oldIndex - newIndex > 0) {
                        if (addStatus == true) e.PosX += sub;
                    } else {
                        if (subStatus == true) e.PosX -= sub;
                    }

                })
                //console.log()
                if (this.Isloop() == true) {
                    this.SwiperLoop(this.swiperPos, this.slideV, this.SwiperW);
                }
                swiperPos.forEach(e => {
                    let targetE = e.slide;
                    this.transformElementTo(targetE, e.PosX, data, e);
                })

            }

        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue !== oldValue && newValue !== "") {
            if (name === "config-data") {
                setTimeout(() => {
                    this.getConftigData(newValue, this.setup.bind(this));
                }, 330)

            }
            if (name === "navi-input") {
                if (this.swiperPos && this.config) {
                    this.slideTo(oldValue, newValue, this.swiperPos, this.config);
                }

            }
        }
    }
    connectedCallback() {

        setTimeout(() => {
            this.slidesData = this.createSlidesData();
            this.setSwiperHeight(this.slidesData);
        }, 300)
    }
    adoptedCallback() {
        setTimeout(() => {
            this.slidesData = this.createSlidesData();
            this.setSwiperHeight(this.slidesData);
        }, 300)
    }

})


//configuation script
function HupSwiperConfig (data) {
    const hasProp = (prop, arrayD) => {
        return prop in arrayD
    }
    const ElementInDoc = (selector) => {
        return document.body.contains(document.querySelector(selector));
    }
    const CreateBlob = (data) => {
        const uploadData = JSON.stringify(data);
        const blob = new Blob([uploadData], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }
    //get target element
    try {
        if (!hasProp('id', data)) throw 'attr';
        if (!ElementInDoc(`#${data.id}`)) throw 'doc';
        if (!CreateBlob(data)) throw 'blob';
        let targetE = document.querySelector(`#${data.id}`);
        targetE.setAttribute('config-data', CreateBlob(data))
    } catch (error) {
        switch (error) {
            case "attr":
                console.error('The data must containe the id of the target');
                break;
            case "doc":
                //console.error(`The Element with the id: "${data.id}" can not be found`); 
                break;
            case "blob":
                console.error('Can´t create blob from data');
                break;
            default:
                console.error('Something went wrong');
        }
    }
}

function autoPlay (targetId, delay){
    let targetE = document.querySelector(`#${targetId}`); 
    const next = () =>{
        let currentV = targetE.getAttribute('navi-input'); 
        let x = ()=>{
            let test = Number(currentV); 
            test += 1; 
            return test; 
        }; 
        targetE.setAttribute('navi-input',x()); 
    }
    const swiperAutoplay = setInterval(()=>{
        next();
    }, delay)
}

function Hup_Swiper_Next(swiperId) {
    //
    let targetE = document.querySelector(`#${swiperId}`);
    let currentV = targetE.getAttribute('navi-input');
    let x = () => {
        let test = Number(currentV);
        test += 1;
        return test;
    };
    targetE.setAttribute('navi-input', x());

}
function Hup_Swiper_Prev(swiperId) {
    let targetE = document.querySelector(`#${swiperId}`);
    let currentV = targetE.getAttribute('navi-input');
    let x = () => {
        let test = Number(currentV);
        test -= 1;
        return test;
    };
    targetE.setAttribute('navi-input', x());
}