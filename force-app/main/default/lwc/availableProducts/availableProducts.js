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

//import label
import Select_Pricebook_Label from  '@salesforce/label/c.Select_Pricebook_Label';
import Search_Product_Label from  '@salesforce/label/c.Search_Product_Label';
import Available_Product_Label from  '@salesforce/label/c.Available_Product_Label';
import Loading_Label from  '@salesforce/label/c.Loading_Label';
import OrderItem_Insert_Error from  '@salesforce/label/c.OrderItem_Insert_Error';


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

    labels = {
        Select_Pricebook_Label,
        Search_Product_Label,
        Available_Product_Label,
        Loading_Label,
        OrderItem_Insert_Error
    }
    @api flexipageRegionWidth;
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
    pricebookId;

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
     * Attribute to store Search String
     */
    @track searchString;

    /**
     * Stores the status of loading data in component
     */
    @track isLoading = false;

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
     * Attribute to refreshApex when Pricebook is changed
     */
    @track wiredAvailableProducts;
    /**
     * it stores the height of datatable
     */
    @api height = 150;

    /**
     * call to check feature access when loaded
     */
    connectedCallback() {
        this.isLoading = true;
        this.instantiateMessageChannel();
    }

    /**
     * Get Message context FROM Message channel
     */
    @wire(MessageContext)
    messageContext;

    /**
     * return the  style property of datatable
     * @returns {string}
     */
    get styleAttr(){
        return 'height: '+this.height+'px;';
    }
    /**
     * Method to show formatted Pricebooks and select a default pricebook
     * @returns {*[]}
     */
    get pricebookList(){
        let result = [];
        this.pricebooks.forEach(pricebook=>{
            result.push({label:pricebook.Name,value:pricebook.Id});
        });
        return result;
    }

    /**
     * Getter to show formatted product List
     * @returns {*[]}
     */
    get products(){
        this.isLoading = true;
        return this._createGroup();

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
            let defaultPricebook = this.pricebooks.find(pricebook=>pricebook.Name===this.defaultPricebook)
            if(defaultPricebook)this.pricebookId = defaultPricebook.Id
        } else if (error) {
            this.handleError(error);
        }
    }

    /**
     * Method to get available products from Org
     * @param result
     */
    @wire(getAvailableProducts,{pricebookId:'$pricebookId'})
    wiredProductResponse(result) {
        this.wiredAvailableProducts = result;
        if (result.data) {
            this.availableProducts = result.data;
        } else if (result.error) {
            this.handleError(result.error);
        }
    }

    /**
     * Method to create group on datatable based on selected/unselected products
     * @returns {*[]}
     */
    _createGroup(){
        let existingProducts=[];
        let newProducts=[];
        let result;
        if(this.orderItems) {
            this.availableProducts.forEach(product => {
                let productFound = this.orderItems.find(orderItem => orderItem.product2Id === product.Product2Id);
                if (productFound) existingProducts.push(product);
                else newProducts.push(product);
            })
            result = this._filterProducts(existingProducts).concat(this._filterProducts(newProducts));
            this.isLoading = false;
            return result;
        }
        result = this._filterProducts(this.availableProducts);
        this.isLoading = false;
        return result;
    }

    /**
     * Method to handle search string change
     * @param event
     */
    handleSearch(event){
        this.searchString = event.detail.value
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
        } else{
            this.showToast('Info',this.labels.OrderItem_Insert_Error,'info')
        }
    }

    /**
     * Method to filter product based on Product Name
     * @param records
     * @returns {*}
     */
    _filterProducts(records){
        if(this.searchString && records.length>0){
            return records.filter(record=> record.Name.toLowerCase().includes(this.searchString.toLowerCase()));

        }
        return records;
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
        this.isLoading = false;
    }

    /**
     * Method to process messaging channel event
     * @param message
     */
    handleMessage(message) {

        let payload = message.message;
        if(message.source === 'orderActivated' && payload.order.Id === this.recordId) {
            this.isLoading = true;
            this.order = payload.order;
            this.isLoading = false;
        }
        else if(message.source === 'orderItemInserted' && payload.orderId === this.recordId) {
            this.isLoading = true;
            refreshApex(this.wiredOrderItemResults)
            this.isLoading = false;
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