package patterns.factory_method;

public class Circle implements Shape {
    @Override
    public void draw() {
        System.out.println("→ Vẽ Hình Tròn ●");
    }
}
