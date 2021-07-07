/**
 * Created by vishalshete on 06/07/2021.
 */

public inherited sharing class OrderProductsController {


    public static Id orderRecordId;

    public static List<OrderItem> orderItems{
        get{
            if(orderItems==null){
                orderItems = [SELECT Id,Product2.Name,Quantity,UnitPrice,TotalPrice FROM OrderItem WHERE OrderId = :orderRecordId WITH SECURITY_ENFORCED ];
            }
            return orderItems;
        }
        set{}
    }

    public static Map<Id,PricebookEntry> pricebookEntryMap{
        get{
            if(pricebookEntryMap==null){
                pricebookEntryMap = new Map<Id,PricebookEntry>([SELECT Name,Id,UnitPrice,Product2Id FROM PricebookEntry WHERE IsActive = TRUE  WITH SECURITY_ENFORCED ]);
            }
            return pricebookEntryMap;
        }
        set;
    }
    @AuraEnabled(Cacheable=true)
    public static List<OrderItem> getAvailableOrderItems(Id orderId){
        try {
            orderRecordId = orderId;
            return orderItems;
        } catch (Exception ex){
            throw ex;
        }
    }
    @AuraEnabled(Cacheable=true)
    public static Order getOrder(Id orderId){
        try {
            return [SELECT Id, Status FROM Order WHERE Id = :orderId WITH SECURITY_ENFORCED];
        } catch (Exception ex){
            throw ex;
        }
    }

    @AuraEnabled
    public static List<OrderItem> addOrderItem(Id orderId,Id productId,Id pricebookEntryId){
        try {
            orderRecordId = orderId;
            if (Schema.SObjectType.OrderItem.isCreateable()) {
                List<OrderItem> updatedOrderItems = checkExistingOrderItem(orderItems,productId);
                if(updatedOrderItems==null) {
                    OrderItem orderItem         = new OrderItem();
                    orderItem.OrderId           = orderId;
                    orderItem.Product2Id        = productId;
                    System.debug(pricebookEntryMap);
                    orderItem.UnitPrice         = pricebookEntryMap.get(pricebookEntryId).UnitPrice;
                    orderItem.Quantity          = 1;
                    orderItem.PricebookEntryId  = pricebookEntryId;
                    insert orderItem;
                    orderItems.add(orderItem);
                } else {
                    update updatedOrderItems;
                    orderItems = updatedOrderItems;
                }
                return orderItems;

            } else {
                throw new CustomException('You don\'t have access to create Order Item');
            }
        } catch (Exception ex){
            throw ex;
        }
    }
    @AuraEnabled
    public static Order activateOrderItems(Id orderId){
        try {
            Order order = new Order();
            if (Schema.SObjectType.OrderItem.isUpdateable()) {
                order.Id = orderId;
                order.Status = 'Activated';
                update order;
            } else {
                throw new CustomException('You don\'t have access to create Order');
            }
            return order;
        } catch (Exception ex){
            throw ex;
        }
    }
    private static List<OrderItem> checkExistingOrderItem(List<OrderItem> orderItems,Id productId){
        for(OrderItem orderItem:orderItems){
            if(orderItem.Product2Id==productId){
                orderItem.Quantity +=1;
                return orderItems;
            }
        }
        return null;
    }
}