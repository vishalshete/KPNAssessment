/**
 * Created by vishalshete on 06/07/2021.
 */

//import lightning method
import {LightningElement,api,wire,track} from 'lwc';
import { refreshApex } from '@salesforce/apex';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import { subscribe,APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import MessagingService from '@salesforce/messageChannel/orderMessage__c';
//import apex controller
import getAvailableProducts from '@salesforce/apex/OrderProductsController.getAvailableOrderItems';
import addOrderItem from '@salesforce/apex/OrderProductsController.addOrderItem';



const COLUMNS = [
    {label: 'Name',fieldName: 'Product2.Name',type: 'text'},
    {label: 'Unit Price',fieldName: 'UnitPrice',type: 'currency'},
    {label: 'Quantity',fieldName: 'Quantity',type: 'number'},
    {label: 'Total Price',fieldName: 'UnitPrice',type: 'currency'},
];

export default class OrderProducts extends LightningElement {

    @api recordId;
    @track wiredOrderItemResults;
    @track orderItems;

    orderItemColumns = COLUMNS;
    @track newProductId;
    /**
     *
     * @type {null} stores subscription data when message is received on Message channel
     */
    subscription = null;

    // get orderItemsToDisplay(){
    //     let result = this.orderItems.forEach(orderItem=>{
    //         result.push(orderItem)
    //     })
    //     result
    // }

    /**
     * call to check feature access when loaded
     */
    connectedCallback() {
        this.instantiateMessageChannel();
    }

    /**
     * Get Message context FROM Message channel
     */
    @wire(MessageContext)
    messageContext;

    @wire(getAvailableProducts,{orderId:'$recordId'})
    wiredOrderItems(result) {
        this.wiredOrderItemResults = result;
        if (result.data) {
            this.orderItems = result.data;
        } else if (result.error) {
            this.handleError(result.error)
        }
    }


    /**
     * register self on Message channel message subscription
     */
    instantiateMessageChannel(){
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext,
            MessagingService, (message) => {
                this.handleMessage(message);
            },
            {scope: APPLICATION_SCOPE});
    }

    handleMessage(message) {
        let payload = message.message;
        if(message.source === 'availableProduct' && payload.orderId === this.recordId) {
            this.newPricebookEntryId    = payload.pricebookEntryId;
            this.newProductId              = payload.product2Id;
        }
        this.addOrderItem();
    }

    async addOrderItem(){
        try {
            this.orderItems = await addOrderItem({
                pricebookEntryId: this.newPricebookEntryId,
                productId: this.newProductId,
                orderId:this.recordId
            })
        } catch (e){
            this.handleError(e);
        }
    }


    handleError(error){
        this.showToast('Error',error,'error')
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