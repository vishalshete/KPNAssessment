/**
 * Created by vishalshete on 06/07/2021.
 */

//import methods
import {LightningElement,track,wire,api} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import {MessageEventController} from "c/messageEventController";

//import controller
import getPricebooks from '@salesforce/apex/AvailableProductsController.getPricebooks';
import getAvailableProducts from '@salesforce/apex/AvailableProductsController.getAvailableProducts';


const COLUMNS = [
    {label: '',
        type: 'button-icon',
        initialWidth: 75,
        typeAttributes: {
            iconName: 'utility:add',
            title: 'Add',
            variant: 'border-filled',
            alternativeText: 'View'
        }
    },
    {label: 'Name',fieldName: 'Name',type: 'text'},
    {label: 'List Price',fieldName: 'UnitPrice',type: 'currency'}
];
export default class AvailableProducts extends LightningElement {

    @track pricebooks = [];
    @track availableProducts=[];
    @track pricebookId;
    @api defaultPricebook = 'Standard Price Book';
    @api recordId;
    productColumns = COLUMNS;

    get pricebookList(){
        let result = [];
        this.pricebooks.forEach(pricebook=>{
            result.push({label:pricebook.Name,value:pricebook.Id});
            if(pricebook.Name===this.defaultPricebook) this.pricebookId = pricebook.Id;
        });
        return result;
    }

    get products(){
        return this.availableProducts;
        // let result=[];
        // this.availableProducts.forEach(product=>{
        //
        // })
    }

    @wire(getPricebooks)
    wiredPricebookResponse({ data, error }) {
        if (data) {
            this.pricebooks = data;
        } else if (error) {
            this.handleError(error);
        }
    }


    @wire(getAvailableProducts,{pricebookId:'$pricebookId'})
    wiredProductResponse({ data, error }) {
        if (data) {
            this.availableProducts = data;
        } else if (error) {
            this.handleError(error);
        }
    }

    handleRowAction(event){
        const row = event.detail.row;

        let selectedProduct = this.availableProducts.find(prod=>prod.Id===row.Id);
        let payload = {orderId: this.recordId, pricebookEntryId: selectedProduct.Id,product2Id:selectedProduct.Product2Id};
        this.dispatchMessage('availableProduct',payload);
    }



    handlePricebookChange(event){
        this.pricebookId = event.detail.value
    }
    handleError(error){
        this.showToast('Error',error,'error')
    }

    dispatchMessage(source,payload) {
        new MessageEventController(this).sendMessage(source,payload);
    }

    showToast(title,message,variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant:variant
        });
        this.dispatchEvent(event);
    }

}