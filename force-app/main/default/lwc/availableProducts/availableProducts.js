/**
 * Created by vishalshete on 06/07/2021.
 */

//import methods
import {LightningElement,track,wire,api} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import {MessageEventController} from "c/messageEventController";
import MessagingService from '@salesforce/messageChannel/orderMessage__c';

//import controller
import getPricebooks from '@salesforce/apex/AvailableProductsController.getPricebooks';
import getOrder from '@salesforce/apex/OrderProductsController.getOrder';
import getAvailableProducts from '@salesforce/apex/AvailableProductsController.getAvailableProducts';
import getAvailableOrderItems from '@salesforce/apex/OrderProductsController.getAvailableOrderItems';
import {APPLICATION_SCOPE, MessageContext, subscribe} from "lightning/messageService";


const COLUMNS = [
    {label: '',
        type: 'button-icon',
        initialWidth: 75,
        typeAttributes: {
            iconName: 'utility:add',
            title: 'Add',
            variant: 'border-filled',
            alternativeText: 'View',
        }
    },
    {label: 'Name',fieldName: 'Name',type: 'text'},
    {label: 'List Price',fieldName: 'UnitPrice',type: 'currency'}
];
export default class AvailableProducts extends LightningElement {

    /**
     * Array to store List of Pricebooks
     * @type {[]}
     */
    @track pricebooks = [];
    /**
     * Array to store list of available products
     * @type {[]}
     */
    @track availableProducts=[];
    /**
     * Selected Pricebook Id
     */
    @track pricebookId;
    /**
     * Attribute to store default pricebook
     * @type {string}
     */
    @api defaultPricebook = 'Standard Price Book';
    /**
     * record Id of the Order
     */
    @api recordId;
    /**
     * Attribute to prefrom refresh Apex for Order Item results
     */
    @track wiredOrderItemResults;
    /**
     * Attribute to store list of Order Items
     */
    @track orderItems;
    /**
     * Attribute to store Available Products datatable columns
     * @type {[{initialWidth: number, label: string, type: string, typeAttributes: {iconName: string, variant: string, title: string, alternativeText: string}}, {fieldName: string, label: string, type: string}, {fieldName: string, label: string, type: string}]}
     */
    productColumns = COLUMNS;
    /**
     * Stores Order Record
     */
    @track order;

    /**
     * Return true if order is Activated
     * @returns {boolean}
     */
    get isActivated(){
        if(this.order) return this.order.Status === 'Activated';
    }

    /**
     *
     * @type {null} stores subscription data when message is received on Message channel
     */
    subscription = null;
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
     * Method to show formatted Pricebooks and select a default pricebook
     * @returns {*[]}
     */
    get pricebookList(){
        let result = [];
        this.pricebooks.forEach(pricebook=>{
            result.push({label:pricebook.Name,value:pricebook.Id});
            if(pricebook.Name===this.defaultPricebook) this.pricebookId = pricebook.Id;
        });
        return result;
    }

    /**
     * Getter to show formatted product List
     * @returns {*[]}
     */
    get products(){
        return this.createGroup();
    }

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
     * Method to get existing orderItems to group them based on selected/Unselected Products
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
     * Method to query existing pricebooks for the org
     * @param data
     * @param error
     */
    @wire(getPricebooks)
    wiredPricebookResponse({ data, error }) {
        if (data) {
            this.pricebooks = data;
        } else if (error) {
            this.handleError(error);
        }
    }

    /**
     * Method to get available products from Org
     * @param data
     * @param error
     */
    @wire(getAvailableProducts,{pricebookId:'$pricebookId'})
    wiredProductResponse({ data, error }) {
        if (data) {
            this.availableProducts = data;
        } else if (error) {
            this.handleError(error);
        }
    }

    /**
     * Method to create group on datatable based on selected/unselected products
     * @returns {*[]}
     */
    createGroup(){
        let existingProducts=[];
        let newProducts=[];
        this.availableProducts.forEach(product=>{
            let productFound = this.orderItems.find( orderItem=> orderItem.Product2Id===product.Product2Id);
            if(productFound) existingProducts.push(product);
            else newProducts.push(product);
        })
        return existingProducts.concat(newProducts);
    }

    /**
     * Method to execute when button on row is clicked
     * @param event
     */
    handleRowAction(event){
        if(!this.isActivated) {
            const row = event.detail.row;
            let selectedProduct = this.availableProducts.find(prod => prod.Id === row.Id);
            let payload = {
                orderId: this.recordId,
                pricebookEntryId: selectedProduct.Id,
                product2Id: selectedProduct.Product2Id
            };
            this.dispatchMessage('availableProduct', payload);
        }
    }


    /**
     * method to execute when pricebook is changed in combobox
     * @param event
     */
    handlePricebookChange(event){
        this.pricebookId = event.detail.value
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
        if(message.source === 'orderActivated' && payload.order.Id === this.recordId) {
            this.order = payload.order;
        }//orderItemInserted
        else if(message.source === 'orderItemInserted' && payload.orderId === this.recordId) {
            refreshApex(this.wiredOrderItemResults)
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