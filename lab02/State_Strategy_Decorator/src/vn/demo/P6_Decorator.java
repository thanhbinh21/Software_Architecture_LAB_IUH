package vn.demo;

// 1. Interface Món uống chung
interface Beverage {
    String getDescription();
    double cost();
}

// 2. Món gốc (Component)
class Espresso implements Beverage {
    public String getDescription() { return "Cà phê Espresso"; }
    public double cost() { return 20.0; } // 20k
}

// 3. Lớp ảo Decorator (Giữ tham chiếu tới món bị bọc)
abstract class AddOnDecorator implements Beverage {
    protected Beverage beverage; // Món đang được bọc

    public AddOnDecorator(Beverage beverage) {
        this.beverage = beverage;
    }
}

// 4. Các món thêm cụ thể (Concrete Decorators)
class Milk extends AddOnDecorator {
    public Milk(Beverage beverage) { super(beverage); }

    public String getDescription() { return beverage.getDescription() + " + Sữa"; }
    public double cost() { return beverage.cost() + 5.0; } // Thêm 5k
}

class Mocha extends AddOnDecorator {
    public Mocha(Beverage beverage) { super(beverage); }

    public String getDescription() { return beverage.getDescription() + " + Mocha"; }
    public double cost() { return beverage.cost() + 10.0; } // Thêm 10k
}

// 5. Class chính để chạy demo
public class P6_Decorator {
    public static void runDemo() {
        System.out.println("--- DEMO DECORATOR PATTERN ---");
        
        // B1: Tạo ly cafe gốc
        Beverage myCup = new Espresso();
        System.out.println(myCup.getDescription() + " = " + myCup.cost() + "k");

        // B2: Thêm sữa (Bọc lớp 1)
        myCup = new Milk(myCup);
        System.out.println(myCup.getDescription() + " = " + myCup.cost() + "k");

        // B3: Thêm Mocha (Bọc lớp 2)
        myCup = new Mocha(myCup);
        System.out.println("Cuối cùng: " + myCup.getDescription() + " = " + myCup.cost() + "k");
    }
}