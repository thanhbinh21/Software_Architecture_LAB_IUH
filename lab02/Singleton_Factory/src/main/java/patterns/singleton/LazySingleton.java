package patterns.singleton;

/**
 * Singleton Pattern - Khởi tạo muộn (Lazy)
 * Instance chỉ được tạo khi gọi getInstance() lần đầu
 */
public class LazySingleton {
    
    private static LazySingleton instance;
    
    private LazySingleton() {
        System.out.println("→ Lazy Singleton được tạo khi cần!");
    }
    
    public static synchronized LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
