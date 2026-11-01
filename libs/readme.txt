================================================================================

           DANH SÁCH PHẦN MỀM VÀ THƯ VIỆN SỬ DỤNG (THƯ MỤC "libs")

       Dự án: Phân tích dữ liệu trên sàn thương mại điện tử TikTok Shop

                          Thuộc: Dự án Big Data

================================================================================


--------------------------------------------------------------------------------

1. PHẦN MỀM VÀ CÔNG CỤ THEO GIAI ĐOẠN

--------------------------------------------------------------------------------



1.1. Thu thập, xử lý và lưu trữ dữ liệu 

- Python: Ngôn ngữ lập trình chính để crawl, làm sạch, biến đổi và xử lý dữ liệu.

- Scrapy / BeautifulSoup / Selenium: Công cụ và thư viện Python hỗ trợ cào (crawl) 

  dữ liệu thô từ đa nguồn trên web.

- Google Colab: Môi trường Notebook trực tuyến phục vụ xử lý dữ liệu (ETL), 

  xây dựng và thực nghiệm các mô hình học máy.

- MongoDB Atlas: Nền tảng cơ sở dữ liệu NoSQL đám mây lưu trữ dữ liệu của dự án.

- MongoDB Compass: Công cụ giao diện trực quan kết nối, truy vấn dữ liệu MongoDB.

- Visual Studio Code (VS Code): Môi trường soạn thảo mã nguồn chính.

- Git & GitHub: Quản lý phiên bản mã nguồn và phối hợp làm việc nhóm.



1.2. Phân tích và trực quan hóa dữ liệu 

- Microsoft Power BI Desktop: Công cụ xây dựng mô hình dữ liệu (Star Schema), 

  thiết lập DAX, tạo biểu đồ và thiết kế Dashboard quản trị tương tác.

- Power Query Editor: Công cụ tích hợp trong Power BI để làm sạch và biến đổi 

  dữ liệu bước cuối.



1.3. Phát triển Website tích hợp 

- Node.js & npm: Môi trường thực thi JavaScript và trình quản lý gói.

- Next.js (Phiên bản 16.4.2): Framework phát triển Web dựa trên React, hỗ trợ 

  App Router, định tuyến và API Route.

- React & React-DOM (Phiên bản 19.3.0): Thư viện xây dựng giao diện người dùng.

- TypeScript: Ngôn ngữ mở rộng kiểm tra kiểu dữ liệu cho dự án Web.

- Tailwind CSS: Framework CSS hỗ trợ thiết kế giao diện nhanh chóng.



--------------------------------------------------------------------------------

2. THƯ VIỆN PYTHON (DỮ LIỆU & HỌC MÁY)

--------------------------------------------------------------------------------



2.1. Thư viện xử lý dữ liệu và tính toán

- pandas: Đọc, khảo sát, làm sạch, biến đổi dữ liệu dạng bảng.

- numpy: Tính toán số học, xử lý mảng đa chiều.

- pymongo: Trình điều khiển kết nối Python với MongoDB Atlas.



2.2. Thư viện tiền xử lý dữ liệu (thuộc Scikit-Learn)

- StandardScaler: Chuẩn hóa dữ liệu số (đặc biệt cho K-Means).

- OneHotEncoder: Mã hóa các biến phân loại thành dạng số.

- ColumnTransformer: Áp dụng các phép biến đổi cho từng nhóm cột cụ thể.



2.3. Thư viện xây dựng mô hình học máy (thuộc Scikit-Learn)

- KMeans: Thuật toán phân cụm khách hàng (Học không giám sát) qua chỉ số RFM.

- RandomForestClassifier: Thuật toán phân loại dự đoán trạng thái hủy/hoàn đơn.

- RandomForestRegressor / LinearRegression: Mô hình hồi quy dự đoán doanh thu.

- IsolationForest: Thuật toán phát hiện giao dịch bất thường (Anomaly Detection).



2.4. Thư viện chia dữ liệu và đánh giá mô hình (thuộc Scikit-Learn)

- train_test_split: Phân chia tập dữ liệu Train/Test.

- Các hàm đánh giá: silhouette_score, confusion_matrix, ConfusionMatrixDisplay, 

  accuracy_score, classification_report, mean_absolute_error (MAE), 

  mean_squared_error (MSE/RMSE), r2_score.



2.5. Thư viện trực quan hóa

- matplotlib.pyplot: Vẽ biểu đồ đánh giá mô hình (Elbow curve, Scatter plot, v.v.).



--------------------------------------------------------------------------------

3. THƯ VIỆN VÀ GÓI PHỤ THUỘC WEBSITE (PACKAGE.JSON)

--------------------------------------------------------------------------------



3.1. Dependencies (Gói hoạt động chính)

- next-auth (^4.24.15): Xác thực người dùng, quản lý phiên và phân quyền (JWT).

- bcryptjs (^3.0.3): Băm và kiểm tra mật khẩu an toàn.

- mongodb (^7.7.0) & mongoose (^9.11.2): Kết nối, định nghĩa Schema và thao tác CRUD.

- chart.js (^4.6.1) & react-chartjs-2 (^5.3.1): Vẽ biểu đồ dữ liệu trên Web.

- lucide-react (^1.60.0): Bộ thư viện biểu tượng giao diện.

- react-hot-toast (^2.6.1): Hiển thị thông báo (toast) cho các thao tác người dùng.

- xlsx (^0.18.5): Hỗ trợ tính năng kết xuất báo cáo thống kê ra file Excel/CSV.



3.2. DevDependencies (Gói hỗ trợ phát triển)

- typescript (^5), @types/node (^20), @types/react (^19), @types/react-dom (^19), 

  @types/bcryptjs (^2.4.6).

- tailwindcss (^4) & @tailwindcss/turbopack (^4).
