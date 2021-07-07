/**
 * Created by vishalshete on 06/07/2021.
 */

// import {LightningElement, track, api, wire} from 'lwc';
import MessagingService from '@salesforce/messageChannel/orderMessage__c';
import {createMessageContext, releaseMessageContext, publish} from 'lightning/messageService';

class MessageEventController {
    /**
     * @description provides contextual information about the Lightning Web Components using Message channel
     * @type {Object} creates context w.r.t Message channel
     */
    context = createMessageContext();

    /**
     * deregister from Message channel after component is closed
     */
    disconnectedCallback() {
        releaseMessageContext(this.context);
    }

    /**
     * @description method compose detail attribute, containing message and source and send it.
     * @param source source of the event
     * @param message message in the event
     */
    sendNewMessage(source, message) {
        const payload = {
            source: source,
            message: message
        };
        publish(this.context, MessagingService, payload);
    }

    /**
     *@description exposed to be used to send message
     * @param source source of the event
     * @param message message in the event
     */
    sendMessage = (source, message) => {
        this.sendNewMessage(source, message);

    }
}
export {MessageEventController}
