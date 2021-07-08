/**
 * Created by vishalshete on 06/07/2021.
 */

//import lightning method
import {LightningElement,api,wire,track} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import { subscribe,APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import MessagingService from '@salesforce/messageChannel/orderMessage__c';
import {MessageEventController} from "c/messageEventController";

//import apex controller
import getAvailableOrderItems from '@salesforce/apex/OrderProductsController.getAvailableOrderItems';
import getOrder from '@salesforce/apex/OrderProductsController.getOrder';
import addOrderItem from '@salesforce/apex/OrderProductsController.addOrderItem';
import activateOrderItems from '@salesforce/apex/OrderProductsController.activateOrderItems';

//import labels
import Order_Items_Label from '@salesforce/label/c.Order_Items_Label';
import Activate_Label from '@salesforce/label/c.Activate_Label';
import Activate_Order_Label from '@salesforce/label/c.Activate_Order_Label';

const COLUMNS = [
    {label: 'Name',fieldName: 'orderItemName',type: 'text'},
    {label: 'Unit Price',fieldName: 'unitPrice',type: 'currency'},
    {label: 'Quantity',fieldName: 'quantity',type: 'number'},
    {label: 'Total Price',fieldName: 'totalPrice',type: 'currency'},
];

export default class OrderProducts extends LightningElement {

    labels = {
        Order_Items_Label,
        Activate_Label,
        Activate_Order_Label
    }
    @api flexipageRegionWidth;
    /**
     * Order record id
     */
    @api recordId;
    /**
     * Attribute to perfrom refreshApex for OrderItems
     */
    @track wiredOrderItemResults;
    /**
     * Attribute to Stores OrderItems
     */
    @track orderItems = [];

    /**
     * Attribute to store OrderItem datatable columns
     * @type {[{fieldName: string, label: string, type: string}, {fieldName: string, label: string, type: string}, {fieldName: string, label: string, type: string}, {fieldName: string, label: string, type: string}]}
     */
    orderItemColumns = COLUMNS;
    /**
     * Attribute to store the Product id to be added
     */
    @track newProductId;
    /**
     * Stores Order Record
     */
    @track order;
    /**
     *
     * @type {null} stores subscription data when message is received on Message channel
     */
    subscription = null;

    /**
     * it stores the height of datatable
     */
    @api height = 150;
    /**
     * Stores the status of loading data in component
     */
    @track isLoading = false;

    /**
     * return the  style property of datatable
     * @returns {string}
     */
    get styleAttr(){
        return 'height: '+this.height+'px;';
    }

    /**
     * Return true if order is Activated
     * @returns {boolean}
     */
    get isActivated(){
        if(!this.orderItems) return true;
        if(this.order) return this.order.Status === 'Activated' || this.orderItems.length<1;
    }
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

    /**
     * Method to get order Record details
     * @param result
     */
    @wire(getOrder,{orderId:'$recordId'})
    wiredOrder(result) {
        if (result.data) {
            this.order = result.data;
        } else if (result.error) {
            this.handleError(result.error)
        }
    }

    /**
     * Method to get list of available orderItems
     * @param result
     */
    @wire(getAvailableOrderItems,{orderId:'$recordId'})
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

    /**
     * Method to process messaging channel event
     * @param message
     */
    handleMessage(message) {
        let payload = message.message;
        if(message.source === 'availableProduct' && payload.orderId === this.recordId) {
            this.newPricebookEntryId  = payload.pricebookEntryId;
            this.newProductId         = payload.product2Id;
            this.addOrderItem();
        }
    }

    /**
     * Method to add OrderItem for the order
     * @returns {Promise<void>}
     */
    async addOrderItem(){
        try {
            this.orderItems = await addOrderItem({
                pricebookEntryId: this.newPricebookEntryId,
                productId: this.newProductId,
                orderId:this.recordId
            })
            let payload = {orderId: this.recordId};
            this.dispatchMessage('orderItemInserted',payload);
        } catch (e){
            this.handleError(e.body.message);
        }
    }
    /**
     * Method to dispatch event by messaging channel
     * @param source source of event
     * @param payload payload of event
     */
    dispatchMessage(source,payload) {
        new MessageEventController(this).sendMessage(source,payload);
    }

    /**
     * Method to handle Activate the order
     * @returns {Promise<void>}
     */
    async handleActivateClick(){
        try{
            this.isLoading = true;
            this.order = await activateOrderItems({orderId:this.recordId})
            let payload = {order: this.order};
            this.isLoading = false;
            this.dispatchMessage('orderActivated',payload);
        } catch (e){
            this.handleError(e.body.message);
        }
    }

    /**
     * Method to handle error
     * @param error
     */
    handleError(error){
        this.showToast('Error',error,'error')
    }
    /**
     * Method to show toast on UI
     * @param title tittle of toast
     * @param message message of the toast
     * @param variant variant of toast
     */
    showToast(title,message,variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant:variant
        });
        this.dispatchEvent(event);
    }


}