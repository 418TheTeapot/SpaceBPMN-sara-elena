import ViolationNotification from "./ViolationNotification";
import ElementNotificationsModule from "../element-notifications";
import NotificationsModule from "../notifications";

export default {

  __depends__: [
    ElementNotificationsModule,
    NotificationsModule
  ],
  __init__: [
    'violationNotification',
  ],


  violationNotification: [ 'type', ViolationNotification ]
};