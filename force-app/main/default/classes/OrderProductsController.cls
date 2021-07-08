/**
 * Created by vishalshete on 06/07/2021.
 */

public inherited sharing class OrderProductsController {

    /**
     * Stores the Id of the Order Record
     */
    private static Id orderRecordId;

    /**
     * Stores the Activated Status of the Order
     */
    private static final String ORDER_ACTIVATED_STATUS = 'Activated';
    /**
     * Getter to get a list of Order Items
     */
    public static List<OrderItem> orderItems{
        get{
            if(orderItems==null){
                orderItems = new List<OrderItem>();
                orderItems = [SELECT Id,Product2.Name,Quantity,UnitPrice,TotalPrice FROM OrderItem WHERE OrderId = :orderRecordId WITH SECURITY_ENFORCED ];
            }
            return orderItems;
        }
        set{}
    }

    /**
     * Getter to get a list of PricebookEntries
     */
    public static Map<Id,PricebookEntry> pricebookEntryMap{
        get{
            if(pricebookEntryMap==null){
                pricebookEntryMap = new Map<Id,PricebookEntry>([SELECT Name,Id,UnitPrice,Product2Id FROM PricebookEntry WHERE IsActive = TRUE  WITH SECURITY_ENFORCED ]);
            }
            return pricebookEntryMap;
        }
        set;
    }
    /**
     * Method to get Order Items for a given Order Record
     * @param orderId Id of the Order Record
     *
     * @return List  of Order Items
     */
    @AuraEnabled(Cacheable=true)
    public static List<OrderItemDTO> getAvailableOrderItems(Id orderId){
        try {
            orderRecordId = orderId;
            return convertOrderItemDTO(orderItems);
        } catch (Exception ex){
            throw new CustomException(ex.getMessage());
        }
    }
    /**
     * Method to get Order Record based on Order recoord Id
     * @param orderId Id of the Order Record
     * @return Order Record
     */
    @AuraEnabled(Cacheable=true)
    public static Order getOrder(Id orderId){
        try {
            Order order = [SELECT Id, Status,Account.AccountNumber,OrderNumber,Type,Pricebook2Id,(SELECT Id,Product2.Name,Quantity,UnitPrice,TotalPrice,Product2.ProductCode FROM OrderItems) FROM Order WHERE Id = :orderId WITH SECURITY_ENFORCED];
            return order;
        } catch (Exception ex){
            throw new CustomException(ex.getMessage());
        }
    }

    /**
     * Method add Order Item based  on product
     * @param orderId Id of the Order Record
     * @param productId Id of the Product Record
     * @param pricebookEntryId  Id of the Pricebook Entry Record
     *
     * @return Updated  List of Order Items
     */
    @AuraEnabled
    public static List<OrderItemDTO> addOrderItem(Id orderId,Id productId,Id pricebookEntryId){
        try {
            orderRecordId = orderId;
            if (Schema.SObjectType.OrderItem.isCreateable()) {
                List<OrderItem> updatedOrderItems = checkExistingOrderItem(orderItems,productId);
                if(updatedOrderItems==null) {
                    setPricebookOnOrder(orderId,pricebookEntryId);
                    OrderItem orderItem         = new OrderItem();
                    orderItem.OrderId           = orderId;
                    orderItem.Product2Id        = productId;
                    orderItem.UnitPrice         = pricebookEntryMap.get(pricebookEntryId).UnitPrice;
                    orderItem.Quantity          = 1;
                    orderItem.PricebookEntryId  = pricebookEntryId;
                    insert orderItem;
                    orderItems.add(orderItem);
                } else {
                    update updatedOrderItems;
                    orderItems = updatedOrderItems;
                }
                return convertOrderItemDTO(orderItems);
            } else {
                throw new CustomException(Label.Order_Item_Access_Error);
            }
        } catch (Exception ex){
            throw new CustomException(ex.getMessage());
        }
    }
    private static Order setPricebookOnOrder(Id orderId,Id pricebookEntryId){
        Order order = getOrder(orderId);
        if(order.Pricebook2Id==null) {
            PricebookEntry pricebookEntry = [SELECT Id,Pricebook2Id FROM PricebookEntry WHERE Id = :pricebookEntryId WITH SECURITY_ENFORCED];
            order.Pricebook2Id = pricebookEntry.Pricebook2Id;
            if(Schema.SObjectType.Order.isUpdateable()) update order;
        }
        return order;
    }
    /**
     * Method to Activate the Order record.
     * @param orderId Id of the Order Record
     *
     * @return Updated Order Record
     */
    @AuraEnabled
    public static Order activateOrderItems(Id orderId){
        try {
            Order order = new Order();
            if (Schema.SObjectType.OrderItem.isUpdateable()) {
                if(sendOrder(orderId)) {
                    order.Id = orderId;
                    order.Status = ORDER_ACTIVATED_STATUS;
                    update order;
                }
            } else {
                throw new CustomException(Label.Order_Update_Error);
            }
            return order;
        } catch (Exception ex){
            throw new CustomException(ex.getMessage());
        }
    }


    /**
     * Method to send Order to request catcher
     * @param orderId
     */
    private static Boolean sendOrder(Id orderId){
        Order order = getOrder(orderId);
        List<OrderDTO.orderProducts> orderProducts = new List<OrderDTO.orderProducts>();
        for(OrderItem orderItem : order.OrderItems){
            orderProducts.add(new OrderDTO.orderProducts(orderItem.Product2.Name,orderItem.Product2.ProductCode,orderItem.UnitPrice,orderItem.Quantity));
        }

        List<OrderDTO> orderDTOS  = new List<OrderDTO>();
        orderDTOS.add(new OrderDTO(order.Account.AccountNumber,order.OrderNumber,order.Type,order.Status,orderProducts));
        return PostOrders.postOrder(JSON.serialize(orderDTOS));
    }
    /**
     * Method  to check if  product is already exist in List of Order Items
     * @param orderItems List of OrderItems
     * @param productId record Id of Products
     *
     * @return List of OrderItems
     */
    private static List<OrderItem> checkExistingOrderItem(List<OrderItem> orderItems,Id productId){
        if(orderItems!=null) {
            for (OrderItem orderItem : orderItems) {
                if (orderItem.Product2Id == productId) {
                    orderItem.Quantity += 1;
                    return orderItems;
                }
            }
        }
        return null;
    }

    /**
     * Method to convert OrderItems to  OrderItemDTO
     * @param orderItems List of Order Items
     *
     * @return List of OrderItemDTO
     */
    private static List<OrderItemDTO> convertOrderItemDTO(List<OrderItem> orderItems){
        List<OrderItemDTO> orderItemDTOS = new List<OrderItemDTO>();
        for(OrderItem orderItem:orderItems){
            orderItemDTOS.add(new OrderItemDTO(orderItem.Product2Id,orderItem.Product2.Name,orderItem.UnitPrice,orderItem.Quantity,orderItem.TotalPrice));
        }
        return  orderItemDTOS;
    }
}