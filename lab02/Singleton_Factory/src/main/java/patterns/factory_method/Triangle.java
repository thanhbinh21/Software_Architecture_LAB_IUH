package patterns.factory_method;

public class Triangle implements Shape {
    @Override
    public void draw() {
        System.out.println("→ Vẽ Hình Tam Giác ▲");
    }
}
