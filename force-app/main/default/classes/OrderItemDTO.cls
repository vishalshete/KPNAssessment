/**
 * Created by vishalshete on 08/07/2021.
 * DTO to convert Order Item record to be used  in datatable
 */

public inherited sharing class OrderItemDTO {
    @AuraEnabled
    public String product2Id;
    @AuraEnabled
    public String orderItemName;
    @AuraEnabled
    public Decimal unitPrice;
    @AuraEnabled
    public Decimal quantity;
    @AuraEnabled
    public Decimal totalPrice;

    public  OrderItemDTO(String product2Id,String orderItemName,Decimal unitPrice,Decimal quantity,Decimal totalPrice){
        this.product2Id = product2Id;
        this.orderItemName = orderItemName;
        this.unitPrice = unitPrice;
        this.quantity  = quantity;
        this.totalPrice = totalPrice;
    }
}