/**
 * Created by vishalshete on 07/07/2021.
 */

public inherited sharing class PostOrders {
    private static final String  requestEndPoint = 'https://kpn-order-assessment.requestcatcher.com/test';

    /**
     * Method to post order to request catcher
     * @param payload
     *
     * @return
     */
    public static Boolean postOrder(String payload){
        HttpRequest req = new HttpRequest();
        req.setHeader('Content-Type', 'application/json');
        req.setMethod('POST');
        req.setBody(payload);
        req.setEndpoint(requestEndPoint);
        HttpResponse response = new Http().send(req);
        if (response.getStatusCode() == 200) {
            return true;
        } else{
            throw new CustomException(Label.Order_Integration_Error);
        }
    }

}