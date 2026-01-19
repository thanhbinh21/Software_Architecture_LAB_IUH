package patterns.singleton;

/**
 * Singleton Pattern - Đảm bảo chỉ có 1 instance duy nhất
 * Khởi tạo sớm (Eager): Instance được tạo khi class được load
 */
public class EagerSingleton {
    
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    
    private EagerSingleton() {
        System.out.println("→ Đối tượng Singleton được tạo!");
    }
    
    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
    
    public void showInfo() {
        System.out.println("→ Đây là instance duy nhất của Singleton");
    }
}
