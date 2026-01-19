import patterns.singleton.*;
import patterns.factory_method.*;

/**
 * Demo Singleton và Factory Pattern
 */
public class Main {
    
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║   DEMO DESIGN PATTERNS - JAVA       ║");
        System.out.println("╚══════════════════════════════════════╝\n");
        
        demoSingleton();
        System.out.println();
        demoFactory();
    }
    
    private static void demoSingleton() {
        System.out.println("[1] SINGLETON PATTERN - Đảm bảo chỉ 1 instance");
        System.out.println("─────────────────────────────────────────────");
        
        // Eager Singleton
        System.out.println("\n• Eager Singleton (khởi tạo sớm):");
        EagerSingleton s1 = EagerSingleton.getInstance();
        EagerSingleton s2 = EagerSingleton.getInstance();
        System.out.println("  s1 == s2? " + (s1 == s2));
        s1.showInfo();
        
        // Lazy Singleton
        System.out.println("\n• Lazy Singleton (khởi tạo khi cần):");
        LazySingleton lazy1 = LazySingleton.getInstance();
        LazySingleton lazy2 = LazySingleton.getInstance();
        System.out.println("  lazy1 == lazy2? " + (lazy1 == lazy2));
    }
    
    private static void demoFactory() {
        System.out.println("\n[2] FACTORY PATTERN - Tạo object linh hoạt");
        System.out.println("─────────────────────────────────────────────");
        
        String[] shapes = {"circle", "rectangle", "triangle"};
        
        for (String type : shapes) {
            Shape shape = ShapeFactory.createShape(type);
            if (shape != null) {
                shape.draw();
            }
        }
    }
}
