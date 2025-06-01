document.addEventListener("DOMContentLoaded", function () {
	// Canvas və state menecmenti
	const canvas = new fabric.Canvas("canvas");
	let state = [];
	let mods = 0;

	function saveState() {
		state = state.slice(0, mods + 1);
		state.push(JSON.stringify(canvas));
		mods = state.length - 1;
	}

	saveState();

	canvas.on("object:modified", saveState);
	canvas.on("object:added", saveState);
	canvas.on("object:removed", saveState);

	document.getElementById("btn-undo").addEventListener("click", function () {
		if (mods > 0) {
			mods -= 1;
			canvas.loadFromJSON(state[mods], function () {
				canvas.renderAll();
			});
		}
	});
	document.getElementById("btn-redo").addEventListener("click", function () {
		if (mods < state.length - 1) {
			mods += 1;
			canvas.loadFromJSON(state[mods], function () {
				canvas.renderAll();
			});
		}
	});

	const fileInput = document.getElementById("fileUpload");
	document.getElementById("btn-upload").addEventListener("click", function () {
		fileInput.click();
	});
	fileInput.addEventListener("change", function (e) {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (f) {
				fabric.Image.fromURL(f.target.result, function (img) {
					const canvasWidth = canvas.getWidth();
					const canvasHeight = canvas.getHeight();
					const scaleFactor = Math.min(
						canvasWidth / img.width,
						canvasHeight / img.height,
						1
					);
					if (scaleFactor < 1) {
						img.scale(scaleFactor);
					}
					img.set({
						left: (canvasWidth - img.getScaledWidth()) / 2,
						top: (canvasHeight - img.getScaledHeight()) / 2,
					});
					canvas.add(img);
					canvas.setActiveObject(img);
					canvas.renderAll();
					saveState();
				});
			};
			reader.readAsDataURL(file);
		}
	});

	// Helper to hide all main modals
	function hideAllMainModals() {
		const modals = [
			"cropModal",
			"rotateModal",
			"scaleModal",
			"arrangeModal",
			"adjustModal",
			"effectModal",
			"retouchModal",
			"drawingModal",
		];
		modals.forEach((id) => {
			const el = document.getElementById(id);
			if (el) el.style.display = "none";
		});
	}

	// --- Crop: Direct on canvas ---
	let croppingRect = null;
	let croppingImage = null;
	let croppingActive = false;

	document.getElementById("btn-crop").addEventListener("click", function () {
		// Only allow crop if an image is selected and not already cropping
		const active = canvas.getActiveObject();
		if (croppingActive || !active || active.type !== "image") {
			if (!croppingActive) alert("Şəkil seçin.");
			return;
		}
		croppingActive = true;
		croppingImage = active;

		// Create cropping rectangle overlay
		const rect = new fabric.Rect({
			left: active.left + 20,
			top: active.top + 20,
			width: Math.max(active.getScaledWidth() - 40, 40),
			height: Math.max(active.getScaledHeight() - 40, 40),
			fill: "rgba(0,0,0,0.1)",
			stroke: "#00bcd4",
			strokeWidth: 2,
			transparentCorners: false,
			cornerColor: "#00bcd4",
			hasRotatingPoint: false,
			selectable: true,
			lockRotation: true,
			lockScalingFlip: true,
			lockAngle: true,
			cornerStyle: "circle",
		});
		rect.setControlsVisibility({ mtr: false });

		croppingRect = rect;
		canvas.add(rect);
		canvas.setActiveObject(rect);

		// Show crop instructions (optional)
		const cropMsg = document.createElement("div");
		cropMsg.id = "crop-instructions";
		cropMsg.style.position = "fixed";
		cropMsg.style.top = "20px";
		cropMsg.style.left = "50%";
		cropMsg.style.transform = "translateX(-50%)";
		cropMsg.style.background = "#222";
		cropMsg.style.color = "#fff";
		cropMsg.style.padding = "8px 18px";
		cropMsg.style.borderRadius = "6px";
		cropMsg.style.zIndex = "1000";
		cropMsg.style.fontSize = "16px";
		cropMsg.innerText =
			"Kəsmə sahəsini seçin, Enter ilə təsdiqlə, Esc ilə ləğv et";
		document.body.appendChild(cropMsg);
	});

	// Listen for Enter/Escape for crop confirm/cancel
	document.addEventListener("keydown", function (e) {
		if (!croppingActive) return;
		if (e.key === "Enter") {
			// Confirm crop
			const rect = croppingRect;
			const img = croppingImage;
			if (!rect || !img) return;

			// Get cropping box relative to image
			const imgLeft = img.left,
				imgTop = img.top,
				imgScaleX = img.scaleX || 1,
				imgScaleY = img.scaleY || 1;
			const cropLeft = rect.left - imgLeft;
			const cropTop = rect.top - imgTop;
			const cropWidth = rect.width * (rect.scaleX || 1);
			const cropHeight = rect.height * (rect.scaleY || 1);

			// Create a temp canvas to crop the image
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = cropWidth / imgScaleX;
			tempCanvas.height = cropHeight / imgScaleY;
			const ctx = tempCanvas.getContext("2d");

			const imageElement =
				img._element || img._originalElement || img.getElement();
			ctx.drawImage(
				imageElement,
				cropLeft / imgScaleX,
				cropTop / imgScaleY,
				cropWidth / imgScaleX,
				cropHeight / imgScaleY,
				0,
				0,
				tempCanvas.width,
				tempCanvas.height
			);

			const dataURL = tempCanvas.toDataURL();
			fabric.Image.fromURL(dataURL, function (croppedImg) {
				croppedImg.set({
					left: rect.left,
					top: rect.top,
					angle: img.angle,
					scaleX: 1,
					scaleY: 1,
				});
				canvas.remove(img);
				canvas.remove(rect);
				canvas.add(croppedImg);
				canvas.setActiveObject(croppedImg);
				canvas.renderAll();
				saveState();
			});

			// Cleanup
			const msg = document.getElementById("crop-instructions");
			if (msg) document.body.removeChild(msg);
			croppingRect = null;
			croppingImage = null;
			croppingActive = false;
		} else if (e.key === "Escape") {
			// Cancel crop
			if (croppingRect) canvas.remove(croppingRect);
			const msg = document.getElementById("crop-instructions");
			if (msg) document.body.removeChild(msg);
			croppingRect = null;
			croppingImage = null;
			croppingActive = false;
			canvas.discardActiveObject();
			canvas.renderAll();
		}
	});

	// --- Rotate ---
	document.getElementById("btn-rotate").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active) {
			document.getElementById("flipHorizontal").checked = !!active.flipX;
			document.getElementById("flipVertical").checked = !!active.flipY;
			const btnRect = this.getBoundingClientRect();
			const rotateModal = document.getElementById("rotateModal");
			rotateModal.style.top = btnRect.top + "px";
			rotateModal.style.left = btnRect.right + 10 + "px";
			rotateModal.style.display = "block";
		} else {
			alert("Zəhmət olmasa, obyekt seçin.");
		}
	});
	document.getElementById("rotate90Btn").addEventListener("click", function () {
		const active = canvas.getActiveObject();
		if (active) {
			active.rotate(((active.angle || 0) + 90) % 360);
			canvas.renderAll();
			saveState();
		}
	});
	document
		.getElementById("flipHorizontal")
		.addEventListener("change", function () {
			const active = canvas.getActiveObject();
			if (active) {
				active.set("flipX", this.checked);
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("flipVertical")
		.addEventListener("change", function () {
			const active = canvas.getActiveObject();
			if (active) {
				active.set("flipY", this.checked);
				canvas.renderAll();
				saveState();
			}
		});
	document.getElementById("closeRotate").addEventListener("click", function () {
		document.getElementById("rotateModal").style.display = "none";
		saveState();
	});

	// --- Scale ---
	document.getElementById("btn-scale").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active) {
			let currentScale = active.scaleX || 1;
			document.getElementById("scaleSlider").value = currentScale;
			document.getElementById("scaleInput").value = currentScale;
			const btnRect = this.getBoundingClientRect();
			const scaleModal = document.getElementById("scaleModal");
			scaleModal.style.top = btnRect.top + "px";
			scaleModal.style.left = btnRect.right + 10 + "px";
			scaleModal.style.display = "block";
		} else {
			alert("Obyekt seçin.");
		}
	});
	document.getElementById("scaleSlider").addEventListener("input", function () {
		const active = canvas.getActiveObject();
		if (active) {
			const scaleFactor = parseFloat(this.value);
			active.scale(scaleFactor);
			document.getElementById("scaleInput").value = this.value;
			canvas.renderAll();
			saveState();
		}
	});
	document.getElementById("scaleInput").addEventListener("input", function () {
		const active = canvas.getActiveObject();
		if (active) {
			const scaleFactor = parseFloat(this.value);
			active.scale(scaleFactor);
			document.getElementById("scaleSlider").value = this.value;
			canvas.renderAll();
			saveState();
		}
	});
	document.getElementById("closeScale").addEventListener("click", function () {
		document.getElementById("scaleModal").style.display = "none";
		saveState();
	});

	// --- Arrange ---
	document.getElementById("btn-arrange").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active) {
			document.getElementById("objectName").value = active.name || "";
			document.getElementById("opacitySlider").value = active.opacity || 1;
			document.getElementById("opacityInput").value = active.opacity || 1;
			const btnRect = this.getBoundingClientRect();
			const arrangeModal = document.getElementById("arrangeModal");
			arrangeModal.style.top = btnRect.top + "px";
			arrangeModal.style.left = btnRect.right + 10 + "px";
			arrangeModal.style.display = "block";
		} else {
			alert("Obyekt seçin.");
		}
	});
	document.getElementById("objectName").addEventListener("input", function () {
		const active = canvas.getActiveObject();
		if (active) {
			active.name = this.value;
			saveState();
		}
	});
	document
		.getElementById("opacitySlider")
		.addEventListener("input", function () {
			const active = canvas.getActiveObject();
			if (active) {
				active.set("opacity", parseFloat(this.value));
				document.getElementById("opacityInput").value = this.value;
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("opacityInput")
		.addEventListener("input", function () {
			const active = canvas.getActiveObject();
			if (active) {
				active.set("opacity", parseFloat(this.value));
				document.getElementById("opacitySlider").value = this.value;
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("closeArrange")
		.addEventListener("click", function () {
			document.getElementById("arrangeModal").style.display = "none";
			saveState();
		});

	// --- Adjust ---
	document.getElementById("btn-adjust").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active && active.type === "image") {
			const btnRect = this.getBoundingClientRect();
			const adjustModal = document.getElementById("adjustModal");
			adjustModal.style.top = btnRect.top + "px";
			adjustModal.style.left = btnRect.right + 10 + "px";
			adjustModal.style.display = "block";
		} else {
			alert("Şəkil seçin.");
		}
	});
	function applyAdjustFilters() {
		const active = canvas.getActiveObject();
		if (active && active.type === "image") {
			active.filters = active.filters.filter(
				(f) =>
					f.type !== "Brightness" &&
					f.type !== "Contrast" &&
					f.type !== "Saturation"
			);
			const brightnessVal = parseFloat(
				document.getElementById("brightnessSlider").value
			);
			const contrastVal = parseFloat(
				document.getElementById("contrastSlider").value
			);
			const saturationVal = parseFloat(
				document.getElementById("saturationSlider").value
			);
			if (brightnessVal !== 0) {
				active.filters.push(
					new fabric.Image.filters.Brightness({ brightness: brightnessVal })
				);
			}
			if (contrastVal !== 0) {
				active.filters.push(
					new fabric.Image.filters.Contrast({ contrast: contrastVal })
				);
			}
			if (saturationVal !== 0) {
				active.filters.push(
					new fabric.Image.filters.Saturation({ saturation: saturationVal })
				);
			}
			active.applyFilters();
			canvas.renderAll();
			saveState();
		}
	}
	document
		.getElementById("brightnessSlider")
		.addEventListener("input", applyAdjustFilters);
	document
		.getElementById("contrastSlider")
		.addEventListener("input", applyAdjustFilters);
	document
		.getElementById("saturationSlider")
		.addEventListener("input", applyAdjustFilters);
	document.getElementById("closeAdjust").addEventListener("click", function () {
		document.getElementById("adjustModal").style.display = "none";
		saveState();
	});

	// --- Effects ---
	document.getElementById("btn-effect").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active && active.type === "image") {
			const btnRect = this.getBoundingClientRect();
			const effectModal = document.getElementById("effectModal");
			effectModal.style.top = btnRect.top + "px";
			effectModal.style.left = btnRect.right + 10 + "px";
			effectModal.style.display = "block";
		} else {
			alert("Şəkil seçin.");
		}
	});
	document
		.getElementById("effect-grayscale")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Grayscale");
				active.filters.push(new fabric.Image.filters.Grayscale());
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("effect-sepia")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Sepia");
				active.filters.push(new fabric.Image.filters.Sepia());
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("effect-invert")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Invert");
				active.filters.push(new fabric.Image.filters.Invert());
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("effect-brightness")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Brightness");
				active.filters.push(
					new fabric.Image.filters.Brightness({ brightness: 0.2 })
				);
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("effect-contrast")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Contrast");
				active.filters.push(
					new fabric.Image.filters.Contrast({ contrast: 0.2 })
				);
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document.getElementById("effect-blur").addEventListener("click", function () {
		const active = canvas.getActiveObject();
		if (active && active.type === "image") {
			active.filters = active.filters.filter((f) => f.type !== "Blur");
			active.filters.push(new fabric.Image.filters.Blur({ blur: 0.5 }));
			active.applyFilters();
			canvas.renderAll();
			saveState();
		}
	});
	document
		.getElementById("effect-saturation")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Saturation");
				active.filters.push(
					new fabric.Image.filters.Saturation({ saturation: 0.2 })
				);
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document.getElementById("closeEffect").addEventListener("click", function () {
		document.getElementById("effectModal").style.display = "none";
		saveState();
	});

	// --- Retouch ---
	document.getElementById("btn-retouch").addEventListener("click", function () {
		hideAllMainModals();
		const active = canvas.getActiveObject();
		if (active && active.type === "image") {
			const btnRect = this.getBoundingClientRect();
			const retouchModal = document.getElementById("retouchModal");
			retouchModal.style.top = btnRect.top + "px";
			retouchModal.style.left = btnRect.right + 10 + "px";
			retouchModal.style.display = "block";
		} else {
			alert("Şəkil seçin.");
		}
	});
	document
		.getElementById("retouch-blur")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				active.filters = active.filters.filter((f) => f.type !== "Blur");
				active.filters.push(new fabric.Image.filters.Blur({ blur: 0.7 }));
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("retouch-sharpen")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active && active.type === "image") {
				const sharpenMatrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
				active.filters = active.filters.filter((f) => f.type !== "Convolute");
				active.filters.push(
					new fabric.Image.filters.Convolute({ matrix: sharpenMatrix })
				);
				active.applyFilters();
				canvas.renderAll();
				saveState();
			}
		});
	document
		.getElementById("closeRetouch")
		.addEventListener("click", function () {
			document.getElementById("retouchModal").style.display = "none";
			saveState();
		});

	// --- Drawing: Brush, Eraser, Pen, Fill, Shapes ---
	document.getElementById("btn-drawing").addEventListener("click", function () {
		hideAllMainModals();
		const btnRect = this.getBoundingClientRect();
		const drawingModal = document.getElementById("drawingModal");
		drawingModal.style.top = btnRect.top + "px";
		drawingModal.style.left = btnRect.right + 10 + "px";
		drawingModal.style.display = "block";
	});

	let drawingMode = null;
	let drawingColor = "#000000";
	const drawingColorInput = document.getElementById("drawingColor");
	if (drawingColorInput) {
		drawingColorInput.addEventListener("input", function () {
			drawingColor = this.value;
			if (drawingMode === "brush" && canvas.isDrawingMode) {
				canvas.freeDrawingBrush.color = drawingColor;
			}
		});
	}

	document
		.getElementById("drawing-brush")
		.addEventListener("click", function () {
			canvas.isDrawingMode = true;
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingBrush.color = drawingColorInput.value;
			canvas.freeDrawingBrush.width = 5;
			drawingMode = "brush";
		});

	document
		.getElementById("drawing-eraser")
		.addEventListener("click", function () {
			canvas.isDrawingMode = true;
			if (fabric.EraserBrush) {
				canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
				canvas.freeDrawingBrush.width = 10;
			} else {
				canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
				canvas.freeDrawingBrush.color = "#ffffff";
				canvas.freeDrawingBrush.width = 10;
			}
			drawingMode = "eraser";
		});

	document.getElementById("drawing-pen").addEventListener("click", function () {
		canvas.isDrawingMode = false;
		drawingMode = "pen";
		let drawing = false;
		let path;
		let points = [];
		const color = drawingColorInput.value;

		function mouseDown(o) {
			drawing = true;
			points = [];
			const pointer = canvas.getPointer(o.e);
			points.push({ x: pointer.x, y: pointer.y });
			path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
				stroke: color,
				strokeWidth: 2,
				fill: "",
				selectable: false,
				evented: false,
			});
			canvas.add(path);
		}
		function mouseMove(o) {
			if (!drawing) return;
			const pointer = canvas.getPointer(o.e);
			points.push({ x: pointer.x, y: pointer.y });
			const d = points.reduce(
				(acc, pt, i) =>
					acc + (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`),
				""
			);
			path.set({ path: fabric.Path.parsePath(d) });
			canvas.renderAll();
		}
		function mouseUp() {
			drawing = false;
			path.set({ selectable: true, evented: true });
			canvas.off("mouse:down", mouseDown);
			canvas.off("mouse:move", mouseMove);
			canvas.off("mouse:up", mouseUp);
			saveState();
		}
		canvas.on("mouse:down", mouseDown);
		canvas.on("mouse:move", mouseMove);
		canvas.on("mouse:up", mouseUp);
	});

	document
		.getElementById("drawing-fill")
		.addEventListener("click", function () {
			const active = canvas.getActiveObject();
			if (active) {
				const fillColor = drawingColorInput.value;
				active.set("fill", fillColor);
				canvas.renderAll();
				saveState();
			} else {
				alert("Obyekt seçin.");
			}
		});

	document
		.getElementById("drawing-shapes")
		.addEventListener("click", function () {
			canvas.isDrawingMode = false;
			drawingMode = "shape";
			const color = drawingColorInput.value;
			let drawing = false;
			let shape = null;
			let origX, origY;

			function mouseDown(o) {
				drawing = true;
				const pointer = canvas.getPointer(o.e);
				origX = pointer.x;
				origY = pointer.y;
				shape = new fabric.Rect({
					left: origX,
					top: origY,
					width: 1,
					height: 1,
					fill: color,
					opacity: 0.7,
					selectable: false,
					evented: false,
				});
				canvas.add(shape);
			}
			function mouseMove(o) {
				if (!drawing || !shape) return;
				const pointer = canvas.getPointer(o.e);
				const width = pointer.x - origX;
				const height = pointer.y - origY;
				shape.set({
					width: Math.abs(width),
					height: Math.abs(height),
					left: width < 0 ? pointer.x : origX,
					top: height < 0 ? pointer.y : origY,
				});
				canvas.renderAll();
			}
			function mouseUp() {
				drawing = false;
				if (shape) {
					shape.set({ selectable: true, evented: true, opacity: 1 });
					shape = null;
				}
				canvas.off("mouse:down", mouseDown);
				canvas.off("mouse:move", mouseMove);
				canvas.off("mouse:up", mouseUp);
				saveState();
			}
			canvas.on("mouse:down", mouseDown);
			canvas.on("mouse:move", mouseMove);
			canvas.on("mouse:up", mouseUp);
		});

	document
		.getElementById("closeDrawing")
		.addEventListener("click", function () {
			document.getElementById("drawingModal").style.display = "none";
			canvas.isDrawingMode = false;
			saveState();
		});

	// Delete object with Delete key
	document.addEventListener("keydown", function (e) {
		if (e.key === "Delete" || e.key === "Backspace") {
			const active = canvas.getActiveObject();
			if (active) {
				canvas.remove(active);
				canvas.renderAll();
				saveState();
			}
		}
	});

	// Text: Yeni mətn əlavə (obyektin ölçüsünü kənarlardan dəyişmək mümkün olacaq)
	document.getElementById("btn-text").addEventListener("click", function () {
		const text = new fabric.IText("Yeni Mətn", {
			left: canvas.getWidth() / 2,
			top: canvas.getHeight() / 2,
			fontFamily: "Arial",
			fill: "#000000",
			fontSize: 20,
			originX: "center",
			originY: "center",
		});
		canvas.add(text);
		canvas.setActiveObject(text);
		canvas.renderAll();
		saveState();
	});

	// Export/Save: Use selected object's name as filename if available
	document.getElementById("btn-save").addEventListener("click", function () {
		let filename = "export.png";
		const active = canvas.getActiveObject();
		if (
			active &&
			active.name &&
			typeof active.name === "string" &&
			active.name.trim() !== ""
		) {
			// Sanitize filename
			filename = active.name.trim().replace(/[\\/:*?"<>|]+/g, "_") + ".png";
		}
		const dataURL = canvas.toDataURL({
			format: "png",
			quality: 1.0,
		});
		const link = document.getElementById("downloadLink");
		link.href = dataURL;
		link.download = filename;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
	document.getElementById('btn-home').addEventListener('click', function() {
  window.location.href = 'index.html';
  });

	document.getElementById("btn-home").addEventListener("click", function () {
	window.location.href = "index.html";
});
});
