package vn.demo;

// 1. Interface chung cho các trạng thái
interface State {
    void handleHuyDon();
}

// 2. Các trạng thái cụ thể (Concrete States)
// Trạng thái: Mới tạo
class NewState implements State {
    public void handleHuyDon() {
        System.out.println("✅ [Mới tạo] Hủy đơn thành công. Chưa trừ tiền.");
    }
}

// Trạng thái: Đã giao hàng
class ShippedState implements State {
    public void handleHuyDon() {
        System.out.println("❌ [Đã giao] Không thể hủy. Hàng đã đưa shipper rồi!");
    }
}

// 3. Context (Đối tượng cần thay đổi hành vi)
class OrderContext {
    private State currentState;

    public OrderContext() {
        this.currentState = new NewState(); // Mặc định là mới
    }

    public void setState(State state) {
        this.currentState = state;
    }

    // Hành động hủy sẽ ủy quyền cho State hiện tại xử lý
    public void huyDonHang() {
        currentState.handleHuyDon();
    }
}

// 4. Class chính để chạy demo
public class P4_State {
    public static void runDemo() {
        System.out.println("--- DEMO STATE PATTERN ---");
        OrderContext order = new OrderContext();

        System.out.print("Tình huống 1: ");
        order.huyDonHang(); // Đang ở NewState -> Hủy được

        // Chuyển trạng thái sang Đã giao
        order.setState(new ShippedState());

        System.out.print("Tình huống 2: ");
        order.huyDonHang(); // Đang ở ShippedState -> Không hủy được
    }
}