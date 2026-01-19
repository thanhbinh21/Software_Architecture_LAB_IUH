package vn.demo;

// 1. Interface Chiến lược
interface ShippingStrategy {
    int calculateCost(int weightInKg);
}

// 2. Các chiến lược cụ thể (Concrete Strategies)
// Đi đường bộ (Rẻ, chậm)
class RoadShipping implements ShippingStrategy {
    public int calculateCost(int weight) {
        return weight * 10_000; // 10k/kg
    }
}

// Đi máy bay (Đắt, nhanh)
class AirShipping implements ShippingStrategy {
    public int calculateCost(int weight) {
        return weight * 50_000; // 50k/kg
    }
}

// 3. Context (Dịch vụ vận chuyển)
class ShippingService {
    private ShippingStrategy strategy;

    // Setter để thay đổi chiến lược lúc chạy (Runtime)
    public void setStrategy(ShippingStrategy strategy) {
        this.strategy = strategy;
    }

    public void tinhTienShip(int kg) {
        if (strategy == null) {
            System.out.println("Vui lòng chọn đơn vị vận chuyển!");
            return;
        }
        int cost = strategy.calculateCost(kg);
        System.out.println("💰 Phí ship cho " + kg + "kg là: " + cost + " VNĐ");
    }
}

// 4. Class chính để chạy demo
public class P5_Strategy {
    public static void runDemo() {
        System.out.println("--- DEMO STRATEGY PATTERN ---");
        ShippingService service = new ShippingService();
        int kienHang = 5; // 5kg

        // Khách chọn ship thường
        service.setStrategy(new RoadShipping());
        service.tinhTienShip(kienHang);

        // Khách đổi ý, cần gấp (chỉ cần đổi Strategy, không sửa code cũ)
        service.setStrategy(new AirShipping());
        service.tinhTienShip(kienHang);
    }
}