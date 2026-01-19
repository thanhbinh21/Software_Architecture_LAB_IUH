package patterns.factory_method;

/**
 * Factory Pattern - Tạo đối tượng mà không cần biết class cụ thể
 */
public class ShapeFactory {
    
    public static Shape createShape(String type) {
        switch (type.toLowerCase()) {
            case "circle":
                return new Circle();
            case "rectangle":
                return new Rectangle();
            case "triangle":
                return new Triangle();
            default:
                return null;
        }
    }
}
