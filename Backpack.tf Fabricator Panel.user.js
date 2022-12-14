// ==UserScript==
// @name         Backpack.tf Fabricator Panel
// @namespace    https://github.com/HairGMan
// @version      0.1
// @description  Interface addition for backpack.tf to ease fabricator management
// @author       HairGMan
// @match        https://backpack.tf/profiles/*
// @iconURL      https://steamcdn-a.akamaihd.net/apps/440/icons/professional_kit_rare.97f580303b4d77bfe95dda36615979508a5b0533.png
// @supportURL   https://github.com/HairGMan/bptf-fabricator-panel/issues
// @downloadURL  https://github.com/HairGMan/bptf-fabricator-panel/raw/main/Backpack.tf%20Fabricator%20Panel.user.js
// @updateURL    https://github.com/HairGMan/bptf-fabricator-panel/raw/main/Backpack.tf%20Fabricator%20Panel.meta.js
// @grant        none
// ==/UserScript==

class TwoWayMap {
    constructor(map) {
       this.map = map;
       this.reverseMap = {};
       for(const key in map) {
          const value = map[key];
          this.reverseMap[value] = key;
       }
    }
    get(key) { return this.map[key]; }
    revGet(key) { return this.reverseMap[key]; }
}

//########################### Source: https://stackoverflow.com/a/21070876

let partNameToClassName = new TwoWayMap({
    "Battle-Worn Robot KB-808" :                  "kb",
    "Battle-Worn Robot Taunt Processor" :         "tp",
    "Battle-Worn Robot Money Furnace" :           "mf",
    "Reinforced Robot Bomb Stabilizer" :          "bs",
    "Reinforced Robot Humor Suppression Pump" :   "hsp",
    "Reinforced Robot Emotion Detector" :         "ed",
    "Pristine Robot Currency Digester" :          "cd",
    "Pristine Robot Brainstorm Bulb" :            "bb",
});

function sortWeaponsByFab(selectedFabs){
    let itemsGrouped = new Object();
    let quality = $(".panel-fabs #form-quality").val();
    let craftable = $(".panel-fabs #form-craftable").val();

    for (let fab of selectedFabs){

        let filter = `.item[data-defindex=${fab.weaponDefindex}]`;
        if (quality != "0"){
            filter += `[data-quality=${quality}]`;
        }
        if (craftable != "-1"){
            filter += `[data-craftable=${craftable}]`;
        }

        itemsGrouped[fab.weaponDefindex] = {
            "data" : {},
            "items" : []
        };

        itemsGrouped[fab.weaponDefindex].data = {
            "number" : Object.keys(itemsGrouped).length,
            "color" : (fab.fabTier === "2") ? "#2a5c2a" : "#831",
            "title" : fab.name,
        }
        itemsGrouped[fab.weaponDefindex].items = $(`.inventory .backpack-page:not(.temp-page) ${filter}`);
        $(".inventory .item").remove(`${filter}`);
    }
    itemsGrouped["no-group"] = {"data" : {}, "items" : []};
    itemsGrouped["no-group"].data = {
        "number" : Object.keys(itemsGrouped).length,
        "color" : "#777",
        "title" : "No Kit",
    }

    itemsGrouped["hidden"] = {"data" : {}, "items" : []};
    itemsGrouped["hidden"].data = {
        "number" : Object.keys(itemsGrouped).length,
        "color" : "#777",
        "title" : "Hidden Items",
    }

    itemsGrouped["no-group"].items = $(".inventory .backpack-page:not(.temp-page) .item:not(.spacer)");
    itemsGrouped["hidden"].items = $(".inventory .temp-page .item:not(.spacer)");

    $(".item:not(.spacer)").detach();
    $(".inventory").empty();
    for (let page in itemsGrouped){
        let pageData = itemsGrouped[page].data;
        let pageItems = itemsGrouped[page].items;
        let pageClass = (page === "hidden") ? "temp-page" : "backpack-page";
        $(".inventory").append(`<div class="${pageClass}">
                <div class="page-number">
                    <div class="page-anchor" id="page${pageData.number}"></div>
                    <a class="label label-default" href="#page${pageData.number}" style="color: #ffffff; background-color: ${pageData.color}">${pageData.title}</a>
                    <span class="btn btn-primary btn-xs pull-right select-page">
                         <i class="fa fa-th"></i>
                         Select
                    </span>
                </div>
                <ul class="item-list"></ul>
            </div>`);
        $("#page" + pageData.number).parents(`.${pageClass}`).find(".item-list").append(pageItems);
        $(".inventory .temp-page").css("display","none");
    }
}

class FabricatorItem {
    constructor(itemElement){
        this.itemID = itemElement.dataset.id;
        this.fabTier = itemElement.dataset.ks_tier;
        this.weaponDefindex = itemElement.dataset.priceindex.match(/\d*$/);
        this.name = itemElement.dataset.originalTitle;
        if (this.name === undefined){
            this.name = itemElement.getAttribute("title");
        }
        this.partsDict = new Object();
        for (const attribute of itemElement.attributes){
            if(attribute.name.match(/^data-input_\d+/) != null) {
                this.partsDict[attribute.value.match(/.*(?= x)/)] = parseInt(attribute.value.match(/(?<= x)\d*/));
            }
        }
    }

    getPartAmount(part){
        return this.partsDict[part] ? this.partsDict[part] : 0;
    }
}

class partsPanel {

    constructor(){
        this.selectedFabs = new Array();
        this.fabAmount = {
            "2" : 0,
            "3" : 0,
        }
        this.partsTotal = {
            "Battle-Worn": {
                "Battle-Worn Robot KB-808" : 0,
                "Battle-Worn Robot Taunt Processor" : 0,
                "Battle-Worn Robot Money Furnace" : 0,
            },
            "Reinforced": {
                "Reinforced Robot Bomb Stabilizer" : 0,
                "Reinforced Robot Emotion Detector" : 0,
                "Reinforced Robot Humor Suppression Pump" : 0,
            },
            "Pristine": {
                "Pristine Robot Currency Digester" : 0,
                "Pristine Robot Brainstorm Bulb" : 0,
            },
            "Killstreak Items": {
                "Killstreak Item" : 0,
                "Specialized Killstreak Item" : 0,
            }
        }
    };

    getPartsAvailable(){
        this.partsAvailable = {
            "Battle-Worn": {
                "Battle-Worn Robot KB-808" : 0,
                "Battle-Worn Robot Taunt Processor" : 0,
                "Battle-Worn Robot Money Furnace" : 0,
            },
            "Reinforced": {
                "Reinforced Robot Bomb Stabilizer" : 0,
                "Reinforced Robot Emotion Detector" : 0,
                "Reinforced Robot Humor Suppression Pump" : 0,
            },
            "Pristine": {
                "Pristine Robot Currency Digester" : 0,
                "Pristine Robot Brainstorm Bulb" : 0,
            },
            "Killstreak Items": {
                "Killstreak Item" : 0,
                "Specialized Killstreak Item" : 0,
            }
        };

        for (let tier in this.partsAvailable){
            if (tier != "Killstreak Items"){
                for (let part in this.partsAvailable[tier]){
                    let partItemList = $(".inventory .item[data-base_name='" + part + "']")
                    for(let partItem of partItemList){
                        this.partsAvailable[tier][part] ++;
                    }
                }
            }
        }
    }

    updatePartsAmount(fab, addOrRemove){
        for (let part in fab.partsDict){
                let partTier = part.match(/^\S*/)[0];
                if (partTier === "Killstreak" || partTier === "Specialized"){
                    partTier = "Killstreak Items";
                }

            this.partsTotal[partTier][part] += fab.getPartAmount(part) * addOrRemove;
        }
    }

    addFab(newFabricator){
        if (this.selectedFabs.length == 0){
            this.show();
        }
        this.fabAmount[newFabricator.fabTier] ++;
        this.selectedFabs.push(newFabricator);
        this.updatePartsAmount(newFabricator, 1);
        this.updatePanel();
    }

    removeFab(fabID){
        let fabToRemove = this.selectedFabs.filter(fab => fab.itemID === fabID)[0];
        if (fabToRemove === undefined){
            return;
        }
        else {

            this.fabAmount[fabToRemove.fabTier] --;
            this.updatePartsAmount(fabToRemove,-1);
            this.updatePanel();
            this.selectedFabs = this.selectedFabs.filter(fab => fab.itemID != fabID);
            if (this.selectedFabs.length == 0){
                this.hide();
            }
        }
    }

    updatePanel(){
        for(let tier in this.fabAmount){

            let fabCounter = $(".panel-fabs .fab-" + tier);

            switch(this.fabAmount[tier]){
                case 0:
                    fabCounter.css("display", "none");
                    break;
                case 1:
                    fabCounter.text("");
                    fabCounter.css("display", "inline-block");
                    break;
                default:
                    fabCounter.text(this.fabAmount[tier]);
                    fabCounter.css("display", "inline-block");
                    break;
            }
        }

        let substractOwnedParts = $("#include-parts-total").is(":checked");

        for (let partTier in this.partsTotal){

            let partTierHeader = $(".panel-fabs .part-tier-toggle[data-tier='" + partTier + "']");

            for (let part in this.partsTotal[partTier]){

                let partCounter = $(".panel-fabs dd[data-part='" + part + "']");

                let partAmountToDisplay = this.partsTotal[partTier][part] - this.partsAvailable[partTier][part] * substractOwnedParts;
                partAmountToDisplay = (partAmountToDisplay < 0) ? 0 : partAmountToDisplay;
                partCounter.children("i").html(partAmountToDisplay);

                if (this.partsTotal[partTier][part] > 0){

                    partTierHeader.css("display", "block");

                    if (substractOwnedParts && partAmountToDisplay == 0){
                        partCounter.addClass("empty");
                    }
                    else {
                        partCounter.removeClass("empty");
                    }

                    if (partTierHeader.children("i").hasClass("fa-minus-square-o")){
                        partCounter.css("display", "block");
                    }

                }
                else {
                    partCounter.css("display", "none");
                    if(Object.values(this.partsTotal[partTier]).filter(value => value != 0).length == 0){
                        partTierHeader.css("display", "none");
                    }

                }
            }
        }
    }

    getFabAmount(){
        return this.selectedFabs.length;
    }

    show(){
        let partlinks = {
            "kb" : "https://backpack.tf/classifieds?item=Battle-Worn+Robot+KB-808&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "tp" : "https://backpack.tf/classifieds?item=Battle-Worn+Robot+Taunt+Processor&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "mf" : "https://backpack.tf/classifieds?item=Battle-Worn+Robot+Money+Furnace&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "ed" : "https://backpack.tf/classifieds?item=Reinforced+Robot+Emotion+Detector&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "bs" : "https://backpack.tf/classifieds?item=Reinforced+Robot+Bomb+Stabilizer&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "hsp" : "https://backpack.tf/classifieds?item=Reinforced+Robot+Humor+Suppression+Pump&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "cd" : "https://backpack.tf/classifieds?item=Pristine+Robot+Currency+Digester&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "bb" : "https://backpack.tf/classifieds?item=Pristine+Robot+Brainstorm+Bulb&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0",
            "ks_item" : "https://backpack.tf/classifieds?quality=6&craftable=1&killstreak_tier=1",
            "sp_ks_item" : "https://backpack.tf/classifieds?quality=6&craftable=1&killstreak_tier=2&slot=melee%2Cprimary%2Csecondary",
        }
        $("body").prepend("<div class='panel panel-main panel-fabs'></div>");
        $(".panel-fabs").prepend("<div class='panel-heading'><span>Fabricators selected</span></div>");
        $(".panel-fabs").append("<div class='panel-body' style='background-color: #f1f1f1dc; padding: 9px; padding-top: 2px'></div>");
        $(".panel-fabs .panel-body").append(`
            <div>
                <span class='fab-counter fab-2'></span>
                <span class='fab-counter fab-3'></span>
            </div>
        `)
        $(".panel-fabs .panel-body").append(`
            <div class='panel-section-header'>
                Parts needed
            </div>
        `)
        $(".panel-fabs .panel-body").append(`
            <dl class='parts-needed-list'>
            <dt class='part-tier-toggle' data-tier='Battle-Worn'>Battle-Worn <i class='fa fa-minus-square-o'></i></dt>
                <dd data-part='Battle-Worn Robot Money Furnace' data-tier='Battle-Worn'><a href=${partlinks.mf}>Money Furnace</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Battle-Worn Robot KB-808' data-tier='Battle-Worn'><a href=${partlinks.kb}>KB-808</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Battle-Worn Robot Taunt Processor' data-tier='Battle-Worn'><a href=${partlinks.tp}>Taunt Processor</a> <i class='part-amount'>0</i></dd>
            <dt class='part-tier-toggle' data-tier='Reinforced'>Reinforced <i class='fa fa-minus-square-o'></i></dt>
                <dd data-part='Reinforced Robot Emotion Detector' data-tier='Reinforced'><a href=${partlinks.ed}>Emotion Detector</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Reinforced Robot Humor Suppression Pump' data-tier='Reinforced'><a href=${partlinks.hsp}>Humor Suppression Pump</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Reinforced Robot Bomb Stabilizer' data-tier='Reinforced'><a href=${partlinks.bs}>Bomb Stabilizer</a> <i class='part-amount'>0</i></dd>
            <dt class='part-tier-toggle' data-tier='Pristine'>Pristine <i class='fa fa-minus-square-o'></i></dt>
                <dd data-part='Pristine Robot Currency Digester' data-tier='Pristine'><a href=${partlinks.cd}>Currency Digester</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Pristine Robot Brainstorm Bulb' data-tier='Pristine'><a href=${partlinks.bb}>Brainstorm Bulb</a> <i class='part-amount'>0</i></dd>
            <dt class='part-tier-toggle' data-tier='Killstreak Items'>Killstreak Items <i class='fa fa-minus-square-o'></i></dt>
                <dd data-part='Killstreak Item' data-tier='Killstreak Items'><a href=${partlinks.ks_item}>Killstreak Item</a> <i class='part-amount'>0</i></dd>
                <dd data-part='Specialized Killstreak Item' data-tier='Killstreak Items'><a href=${partlinks.sp_ks_item}>Specialized Killstreak Item</a> <i class='part-amount'>0</i></dd>
            </dl>
        `);
        $(".panel-fabs dd").css("display", "none");
        $(".panel-fabs dt").css("display", "none");
        $(".panel-fabs dt").click(function(){

            if ($(this).children("i").hasClass("fa-minus-square-o")){
                $(this).children("i").removeClass("fa-minus-square-o");
                $(this).children("i").addClass("fa-plus-square-o");

                for (let listItem of $(".panel-fabs dd")){
                    if ($(listItem)[0].dataset.tier === $(this)[0].dataset.tier){
                        $(listItem).css("display", "none");
                    }
                }
            }
            else if ($(this).children("i").hasClass("fa-plus-square-o")){
                $(this).children("i").removeClass("fa-plus-square-o");
                $(this).children("i").addClass("fa-minus-square-o");

                for (let listItem of $(".panel-fabs dd[data-tier='" + $(this)[0].dataset.tier + "']")){
                    if ($(listItem).children("i")[0].textContent != "0" || $(listItem).hasClass("empty")){
                        $(listItem).css("display", "block");
                    }
                }
            }
        });
        $(".panel-fabs .panel-body").append(`
            <div class='panel-section-header'>
                Parts available
            </div>
        `);
        $(".panel-fabs .panel-body").append(`
            <ul class='parts-available-list'>
                <li>
                    <span class='fab-counter part-mf'></span>
                    <span class='fab-counter part-kb'></span>
                    <span class='fab-counter part-tp'></span>
                </li>
                <li>
                    <span class='fab-counter part-ed'></span>
                    <span class='fab-counter part-hsp'></span>
                    <span class='fab-counter part-bs'></span>
                </li>
                <li>
                    <span class='fab-counter part-cd'></span>
                    <span class='fab-counter part-bb'></span>
                </li>
            </ul>
        `);
        for (let tier in this.partsAvailable){
            if (tier != "Killstreak Items"){
                for (let part in this.partsAvailable[tier]){

                    let partCounter = $(".parts-available-list .part-" + partNameToClassName.get(part));
                    partCounter.text(this.partsAvailable[tier][part]);

                    if (this.partsAvailable[tier][part] == 0){
                        partCounter.css("opacity","60%");
                    }
                    else {
                        partCounter.css("opacity","100%")
                    }

                }
            }
        }
        $(".panel-fabs .panel-section-header").last().append(`
        <div style='display: flex; align-items: start'>
            <input id='include-parts-total' style='margin: 3px 3px 0 0; height: 12px' type="checkbox">
            <label style='font-size: 12px; margin-top: 2px'>Include in total</label>
        </div>
        `);
        $("#include-parts-total").on("click", (evt) => {this.updatePanel()});
        $(".panel-fabs .panel-body").append(`
            <div class='panel-section-header' style='margin-bottom: 5px'>
            </div>
        `)
        $(".panel-fabs .panel-body").append(`
        <form class='fab-w-sort-form'></form>
        `)
        $(".panel-fabs .fab-w-sort-form").append(`
        <select class='form-control' id='form-craftable'>
        <option value="-1">Craftable: Any</option>
        <option value="0">Craftable: No</option>
        <option value="1">Craftable: Yes</option>
        </select>
        `)
        $(".panel-fabs .fab-w-sort-form").append(`
        <select class='form-control' id='form-quality'>
        <option value="0">Any Quality</option>
        <option value="6">Unique</option>
        <option value="11">Strange</option>
        <option value="5">Unusual</option>
        <option value="3">Vintage</option>
        <option value="1">Genuine</option>
        <option value="14">Collector's</option>
        <option value="15">Decorated Weapon</option>
        </select>
        `)
        $(".panel-fabs .panel-body").append(`
        <a class="btn btn-primary btn-sort" id="sort-button">Find recipient weapons</a>
        `)
        $("#sort-button").on("click", (evt) => {sortWeaponsByFab(this.selectedFabs)});
    }

    hide(){
        $(".panel-fabs").remove();
    }
}

(function() {
    'use strict';
    $("head").append(`
    <style>
        .parts-needed-list {
            margin-bottom: 1em;
        }
        .parts-needed-list dd a {
            color: #174667;
        }
        .parts-needed-list dd.empty {
            color: #999;
        }
        .parts-needed-list dd.empty a {
            color: #999;
        }
        .part-tier-toggle {
            border-bottom-style: solid;
            border-bottom-width: 1px;
            border-bottom-color: #ccc;
            margin-top: 2px;
        }
        .part-amount {
            float: right;
            margin-right: 3px;
            font-style: normal;
            font-weight: bold;
        }
        .panel-fabs {
            top: 50px;
            left: 12px;
            position: fixed;
            width: 300px;
            z-index: 1050;
            }
        .panel-section-header {
            display: flex;
            flex-direction: row-reverse;
            justify-content: space-between;
            margin-right: 2px;
            color: #777;
            font-weight: bold;
            font-size: 14px;
            border-top-style: solid;
            border-top-width: 2px;
            border-top-color: #aaa;
            padding: 0 1px 0 1px;
        }
        .fab-counter {
            width: 45px;
            display: inline-block;
            height: 45px;
            background-size: contain;
            text-align: right;
            vertical-align: top;
            color: #ffffff;
            text-shadow: 1px 1px 1px #00000099, 0px 0px 2px #000000, 0px 0px 2px #00000099;
            font-weight: bold;
            line-height: 65px;
        }
        .fab-2 {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/professional_kit.4555e9d5b59365f40df4ee93510a42af597db9e0.png);
        }
        .fab-3 {
            background-image:url(https://steamcdn-a.akamaihd.net/apps/440/icons/professional_kit_rare.97f580303b4d77bfe95dda36615979508a5b0533.png);
        }
        .parts-available-list {
            list-style-type: none;
            padding-inline-start: 3px;
            margin-bottom: 7px;
        }
        .part-kb {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_07.939808961a297d1bbb67f552af9eeb25e8367fbb.png);
        }
        .part-tp {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_06.3ce640486d5fec179553be5dff0e0765a6a34aef.png);
        }
        .part-mf {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_08.e40179a0750074ecebcbeb10eaced11a5b6e02f6.png);
        }
        .part-bs {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_05.1564f6529768fa8d3967c4178f80d402f70eeb58.png);
        }
        .part-ed {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_03.582bc1acfb8d9534704ed22968281757a74786e8.png);
        }
        .part-hsp {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_04.f719c7bc4087c2c4e193ab7803c15396b7719b68.png);
        }
        .part-cd {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_01.adf3cca4e4cfe48750b78b8ae6143b1aee6b4416.png);
        }
        .part-bb {
            background-image: url(https://steamcdn-a.akamaihd.net/apps/440/icons/mvm_robits_02.36518bef7cdd18d420dc0a126e616370bc18042a.png);
        }
        .fab-w-sort-form {
            display: flex;
        }
        .fab-w-sort-form>* {
            margin: 2px;
        }
        .btn-sort {
            display: block;
            width: 160px;
            margin: 0 auto;
            margin-top: 2px;
            padding: 6px;
        }
    </style>
    `)
    let partsPanelMain = new partsPanel();
    const invObserver = new MutationObserver((mutationList, observer) => {
         for (const mutation of mutationList) {
             if (mutation.type === 'childList'){
                 if (mutation.addedNodes.length > 0){
                     if (mutation.addedNodes.item(mutation.addedNodes.length - 1).className === 'temp-page'){
                         console.log("Inventario cargado")
                         partsPanelMain.getPartsAvailable();

                         let fabItemList = $(".inventory .item[data-defindex='20002'], .inventory .item[data-defindex='20003']");

                         fabItemList.not(".fab-panel-selectable").on("click",function(){

                             if ((partsPanelMain.getFabAmount() == 0 && $(".inventory .popover").length > 0) || $( this )[0].classList.contains('unselected')){
                                 partsPanelMain.addFab(new FabricatorItem($( this )[0]));
                             }
                             else if (partsPanelMain.getFabAmount() > 0){
                                 partsPanelMain.removeFab($( this )[0].dataset.id);
                             }

                         })
                         fabItemList.not(".fab-panel-selectable").addClass("fab-panel-selectable");

                         $(".inventory .select-page").on("click",function(){
                             for (let fabricator of $(this).parents(".backpack-page").find(".item[data-defindex='20002'], .item[data-defindex='20003']")){
                                 if ($(fabricator).hasClass("unselected")){
                                     partsPanelMain.addFab(new FabricatorItem($(fabricator)[0]));
                                 }
                                 else {
                                     if ($(fabricator).hasClass("no-popover")){
                                         partsPanelMain.removeFab($(fabricator)[0].dataset.id);
                                     }
                                     else{
                                         partsPanelMain.addFab(new FabricatorItem($(fabricator)[0]));
                                     }
                                 }
                             }
                         })

                     }
                 }
             }
         }
    })

    invObserver.observe(document.querySelector(".inventory"),{childList: true});
})();
