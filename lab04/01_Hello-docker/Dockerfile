# Base image
FROM node:18

# Tạo thư mục app trong container
WORKDIR /app

# Copy package.json
COPY package.json .

# Cài dependencies (không có cũng vẫn chạy)
RUN npm install

# Copy source code
COPY . .

# Mở port 3000
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]