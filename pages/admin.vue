<template>
  <ClientOnly>
    <div class="admin-wrap">
      <div v-if="!auth.token" class="login-screen">
        <div class="login-card">
          <img src="/images/sigurban-2.svg" alt="Sig-Urban" class="login-logo">
          <h1>Panel Admin</h1>
          <p class="login-subtitle">Acceso por usuario y rol</p>
          <ElInput v-model="loginForm.email" placeholder="Correo" style="margin-bottom: 12px;" />
          <ElInput v-model="loginForm.password" type="password" placeholder="Contraseña" show-password @keyup.enter="login" />
          <p v-if="loginError" class="login-error">{{ loginError }}</p>
          <ElButton type="primary" @click="login" :loading="loggingIn" style="width:100%">Entrar</ElButton>
        </div>
      </div>

      <div v-else class="admin-panel">
        <aside class="sidebar">
          <img src="/images/logo-sigurban-white.svg" alt="Sig-Urban" class="sidebar-logo">
          <div class="sidebar-user">
            <strong>{{ auth.user?.email }}</strong>
            <span>{{ auth.user?.role }}</span>
          </div>

          <nav>
            <button v-if="isSuperadmin" :class="navClass('submissions')" @click="openTab('submissions')">📥 Leads / Formularios</button>
            <button :class="navClass('blog')" @click="openTab('blog')">📝 Blog</button>
            <button v-if="isSuperadmin" :class="navClass('products')" @click="openTab('products')">🏘️ Proyectos</button>
            <button v-if="isSuperadmin" :class="navClass('hero')" @click="openTab('hero')">🎬 Slider Principal (Home)</button>
            <button v-if="isSuperadmin" :class="navClass('slider')" @click="openTab('slider')">🏡 Modelos de casa</button>
            <button v-if="isSuperadmin" :class="navClass('faq')" @click="openTab('faq')">❓ Preguntas frecuentes</button>
            <button :class="navClass('multimedia')" @click="openTab('multimedia')">📸 Multimedia</button>
            <button v-if="isSuperadmin" :class="navClass('chatbot')" @click="openTab('chatbot')">🤖 Chatbot (Julia)</button>
            <button v-if="isSuperadmin" :class="navClass('users')" @click="openTab('users')">👥 Usuarios</button>
            <button v-if="isSuperadmin" :class="navClass('settings')" @click="openTab('settings')">⚙️ Configuración</button>
          </nav>

          <button class="logout-btn" @click="logout">Cerrar sesión</button>
        </aside>

        <main class="admin-main">
          <section v-if="tab === 'submissions' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Formularios recibidos</h2>
                <p v-if="submissions.length" class="section-hint">{{ submissions.length }} registro{{ submissions.length !== 1 ? 's' : '' }} en total</p>
              </div>
              <ElButton size="small" @click="loadSubmissions" :loading="loadingSubmissions">Actualizar</ElButton>
            </div>

            <div v-if="loadingSubmissions" class="empty-state">Cargando...</div>
            <div v-else-if="!submissions.length" class="empty-state">Sin registros aún.</div>

            <div v-else>
              <!-- Toolbar acciones -->
              <div class="subs-toolbar">
                <label class="subs-check-all">
                  <input
                    type="checkbox"
                    :checked="isAllPageSelected"
                    :indeterminate.prop="isSomePageSelected && !isAllPageSelected"
                    @change="toggleSelectAll"
                  >
                  <span>{{ isAllPageSelected ? 'Deseleccionar todo' : 'Seleccionar página' }}</span>
                </label>

                <div class="subs-toolbar-right">
                  <span v-if="selectedIds.size" class="subs-selected-count">{{ selectedIds.size }} seleccionado{{ selectedIds.size !== 1 ? 's' : '' }}</span>
                  <ElButton v-if="selectedIds.size" size="small" type="danger" @click="deleteSelected" :loading="deletingSubmissions">🗑 Eliminar seleccionados</ElButton>
                  <ElButton size="small" @click="exportXLS">⬇ Exportar Excel</ElButton>
                </div>
              </div>

              <!-- Lista paginada -->
              <div class="submissions-list">
                <div
                  v-for="item in paginatedSubmissions"
                  :key="item.id"
                  class="submission-card"
                  :class="{ 'is-selected': selectedIds.has(item.id) }"
                >
                  <div class="sub-header">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <label class="sub-checkbox" @click.stop>
                        <input type="checkbox" :checked="selectedIds.has(item.id)" @change="toggleSelect(item.id)">
                      </label>
                      <span class="type-badge" :class="`type-${item.type}`">{{ item.type || 'Formulario' }}</span>
                      <span class="sub-date">{{ formatDate(item.created_at) }}</span>
                    </div>
                    <div style="display:flex;gap:8px;">
                      <ElButton size="small" type="primary" plain @click="viewSubmission(item)">Ver todo</ElButton>
                      <ElButton size="small" type="danger" plain @click="deleteSingle(item.id)">🗑</ElButton>
                    </div>
                  </div>
                  <div class="sub-body">
                    <div v-if="item.name" class="sub-field"><strong>Negocio:</strong> {{ item.name }}</div>
                    <div v-if="item.contact" class="sub-field"><strong>Contacto:</strong> {{ item.contact }}</div>
                    <div v-if="item.email" class="sub-field"><strong>Email:</strong> {{ item.email }}</div>
                    <div v-if="item.phone" class="sub-field"><strong>Teléfono:</strong> {{ item.phone }}</div>
                    <div v-if="item.address || item.state" class="sub-field">
                      <strong>Ubicación:</strong> {{ [item.address, item.state].filter(Boolean).join(', ') }}
                    </div>
                    <div v-if="item.product_interest" class="sub-field"><strong>Productos:</strong> {{ item.product_interest }}</div>
                    <div v-if="item.subject" class="sub-field"><strong>Asunto:</strong> {{ item.subject }}</div>
                    <div v-if="item.message" class="sub-field sub-message"><strong>Mensaje:</strong> {{ item.message }}</div>
                  </div>
                </div>
              </div>

              <!-- Paginación -->
              <div v-if="submissionsTotalPages > 1" class="subs-pagination">
                <ElButton size="small" :disabled="subsPage <= 1" @click="subsPage--">← Anterior</ElButton>
                <span class="subs-page-info">{{ subsPage }} / {{ submissionsTotalPages }}</span>
                <ElButton size="small" :disabled="subsPage >= submissionsTotalPages" @click="subsPage++">Siguiente →</ElButton>
              </div>
            </div>

            <!-- Modal detalle completo -->
            <ElDialog v-model="submissionDetailOpen" title="Detalle del formulario" width="560px">
              <div v-if="selectedSubmission" class="sub-detail">
                <div class="sub-detail-row" v-if="selectedSubmission.type">
                  <span class="sub-detail-label">Tipo</span>
                  <span class="type-badge" :class="`type-${selectedSubmission.type}`">{{ selectedSubmission.type }}</span>
                </div>
                <div class="sub-detail-row" v-if="selectedSubmission.created_at">
                  <span class="sub-detail-label">Fecha</span>
                  <span>{{ formatDate(selectedSubmission.created_at) }}</span>
                </div>
                <div class="sub-detail-sep" />
                <div v-for="[label, key] in submissionFields" :key="key"
                  class="sub-detail-row" v-show="selectedSubmission[key]">
                  <span class="sub-detail-label">{{ label }}</span>
                  <span class="sub-detail-value">{{ selectedSubmission[key] }}</span>
                </div>
              </div>
              <template #footer>
                <ElButton @click="submissionDetailOpen = false">Cerrar</ElButton>
                <ElButton type="danger" plain @click="deleteSingle(selectedSubmission.id); submissionDetailOpen = false">🗑 Eliminar</ElButton>
                <ElButton type="primary" @click="exportSingleXLS(selectedSubmission)">⬇ Exportar este</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'blog'">
            <div class="section-header">
              <div>
                <h2>Blog y Recetas</h2>
                <p class="section-hint">Las recetas del home salen de los posts con categoría `Recetas` y pueden usar URL externa.</p>
              </div>
              <ElButton type="primary" size="small" @click="openPost(null)">+ Nuevo post</ElButton>
            </div>

            <div v-if="loadingBlog" class="empty-state">Cargando...</div>
            <div v-else-if="!blogPosts.length" class="empty-state">Sin publicaciones aún.</div>

            <div v-else class="blog-list">
              <div v-for="post in blogPosts" :key="post.id" class="blog-row">
                <div class="blog-row-img">
                  <img v-if="post.image" :src="post.image" :alt="post.title_es || post.title_en">
                  <div v-else class="blog-no-img">IMG</div>
                </div>
                <div class="blog-row-info">
                  <strong>{{ post.title_es || post.title_en }}</strong>
                  <span class="blog-row-meta">
                    <span :class="['pub-badge', post.published ? 'pub' : 'draft']">{{ post.published ? 'Publicado' : 'Borrador' }}</span>
                    <span>{{ post.category || 'Sin categoría' }}</span>
                    <span v-if="post.product_name_es">• {{ post.product_name_es }}</span>
                    <span v-if="post.external_url">• URL externa</span>
                  </span>
                </div>
                <div class="blog-row-actions">
                  <ElButton size="small" @click="openPost(post)">Editar</ElButton>
                  <ElButton size="small" type="danger" @click="deletePost(post.id)">Eliminar</ElButton>
                </div>
              </div>
            </div>

            <ElDialog v-model="postEditorOpen" title="Post del Blog" width="92%" top="3vh">
              <div class="post-editor">
                <div class="editor-grid">
                  <div>
                    <label>Slug</label>
                    <ElInput v-model="editingPost.slug" placeholder="slug-del-post" />
                  </div>
                  <div>
                    <label>Categoría</label>
                    <ElInput v-model="editingPost.category" placeholder="Ej: Recetas, Noticias" />
                  </div>
                  <div>
                    <label>Imagen destacada</label>
                    <div class="image-field">
                      <ElInput v-model="editingPost.image" placeholder="https://assets.sulafbc.com/..." />
                      <ElButton @click="openAssetBrowser('post', '/images')">📂 Directorio</ElButton>
                      <ElButton v-if="editingPost.image" type="danger" plain size="small" @click="editingPost.image = ''">✕</ElButton>
                    </div>
                    <img v-if="editingPost.image" :src="editingPost.image" alt="Imagen destacada" class="image-preview-thumb">
                  </div>
                  <div>
                    <label>Producto relacionado</label>
                    <ElSelect v-model="editingPost.product_id" clearable placeholder="Selecciona un producto">
                      <ElOption v-for="product in products" :key="product.id" :label="product.name_es" :value="product.id" />
                    </ElSelect>
                  </div>
                  <div style="grid-column: 1 / -1;">
                    <label>URL externa para receta (opcional)</label>
                    <ElInput v-model="editingPost.external_url" placeholder="https://sazonsula.com/..." />
                  </div>
                </div>

                <div class="publish-row">
                  <ElSwitch v-model="editingPost.published" active-text="Publicado" inactive-text="Borrador" />
                  <span class="seo-note">SEO automático: se genera desde título, primer párrafo/extracto e imagen destacada.</span>
                </div>

                <ElTabs v-model="editorTab">
                  <ElTabPane label="Español" name="es">
                    <div class="editor-stack">
                      <div>
                        <label>Título (ES)</label>
                        <ElInput v-model="editingPost.title_es" placeholder="Título en español" />
                      </div>
                      <div>
                        <label>Extracto (ES)</label>
                        <ElInput v-model="editingPost.excerpt_es" type="textarea" :rows="3" />
                      </div>
                      <div>
                        <label>Contenido (ES)</label>
                        <RichTextEditor v-model="editingPost.content_es" placeholder="Contenido en español..." />
                      </div>
                    </div>
                  </ElTabPane>
                  <ElTabPane label="English" name="en">
                    <div class="editor-stack">
                      <div>
                        <label>Title (EN)</label>
                        <ElInput v-model="editingPost.title_en" placeholder="Title in English" />
                      </div>
                      <div>
                        <label>Excerpt (EN)</label>
                        <ElInput v-model="editingPost.excerpt_en" type="textarea" :rows="3" />
                      </div>
                      <div>
                        <label>Content (EN)</label>
                        <RichTextEditor v-model="editingPost.content_en" placeholder="English content..." />
                      </div>
                    </div>
                  </ElTabPane>
                </ElTabs>

                <div class="seo-preview">
                  <strong>Vista previa SEO</strong>
                  <p><span>Título ES:</span> {{ seoPreview.es.title }}</p>
                  <p><span>Descripción ES:</span> {{ seoPreview.es.description }}</p>
                  <p><span>Title EN:</span> {{ seoPreview.en.title }}</p>
                  <p><span>Description EN:</span> {{ seoPreview.en.description }}</p>
                </div>
              </div>

              <template #footer>
                <ElButton @click="postEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="savePost" :loading="savingPost">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'products' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Proyectos</h2>
                <p class="section-hint">Proyectos residenciales que se muestran en el home y en /proyectos.</p>
              </div>
              <ElButton type="primary" size="small" @click="openProduct(null)">+ Nuevo proyecto</ElButton>
            </div>

            <div class="products-grid">
              <div v-for="product in products" :key="product.id" class="product-card">
                <div class="product-preview">
                  <img :src="product.image" :alt="product.name_es">
                </div>
                <div class="product-info">
                  <strong>{{ product.name_es }}</strong>
                  <span>{{ product.location_es }}</span>
                  <span>Orden: {{ product.sort_order }}</span>
                </div>
                <div class="product-actions">
                  <ElButton size="small" @click="openProduct(product)">Editar</ElButton>
                  <ElButton size="small" type="danger" @click="deleteProduct(product.id)">Eliminar</ElButton>
                </div>
              </div>
            </div>

            <ElDialog v-model="productEditorOpen" title="Proyecto" width="620px">
              <div class="editor-stack">
                <div>
                  <label>Nombre del proyecto</label>
                  <ElInput v-model="editingProduct.name_es" placeholder="Ej. Colonia El Circilar" />
                </div>
                <div>
                  <label>Ubicación</label>
                  <ElInput v-model="editingProduct.location_es" placeholder="Ej. Siguatepeque, Comayagua" />
                </div>
                <div>
                  <label>Enlace de Google Maps (opcional)</label>
                  <ElInput v-model="editingProduct.maps_url" placeholder="https://maps.app.goo.gl/..." />
                </div>
                <div>
                  <label>Descripción corta (tarjetas del home y listado)</label>
                  <ElInput v-model="editingProduct.description_es" type="textarea" :rows="2" placeholder="Ej. Tu casa, tu hogar. Ubicación privilegiada y excelente plusvalía." />
                </div>
                <div>
                  <label>Descripción completa (página del proyecto)</label>
                  <ElInput v-model="editingProduct.description_long_es" type="textarea" :rows="4" placeholder="Descripción detallada que aparece solo en /proyectos/[slug]" />
                </div>
                <div>
                  <label>Etiqueta (badge)</label>
                  <ElInput v-model="editingProduct.badge_es" placeholder="Disponible" />
                </div>
                <div>
                  <label>Slug (URL)</label>
                  <ElInput v-model="editingProduct.slug" placeholder="colonia-el-circilar" />
                </div>
                <div>
                  <label>Imagen</label>
                  <div class="image-field">
                    <ElInput v-model="editingProduct.image" placeholder="/images/proyectos/..." />
                    <ElButton @click="openAssetBrowser('product', '/images')">📂 Directorio</ElButton>
                    <ElButton v-if="editingProduct.image" type="danger" plain size="small" @click="editingProduct.image = ''">✕</ElButton>
                  </div>
                  <img v-if="editingProduct.image" :src="editingProduct.image" alt="Proyecto" class="image-preview-thumb product">
                </div>
                <div>
                  <label>Orden</label>
                  <ElInputNumber v-model="editingProduct.sort_order" :min="0" />
                </div>
                <div>
                  <label>Activo</label>
                  <ElSwitch v-model="editingProduct.is_active" />
                </div>
              </div>
              <template #footer>
                <ElButton @click="productEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="saveProduct" :loading="savingProduct">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'hero' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Slider Principal (Home)</h2>
                <p class="section-hint">El banner grande de arriba en el home. Puede llevar imagen o video, y solo se muestran los items activos.</p>
              </div>
              <div style="display:flex;gap:8px;">
                <ElButton size="small" tag="a" href="/" target="_blank">👁 Ver en home</ElButton>
                <ElButton type="primary" size="small" @click="openHeroSlide(null)">+ Nuevo slide</ElButton>
              </div>
            </div>

            <div class="hero-autoplay-row">
              <label>Duración de cada slide</label>
              <ElInputNumber v-model="heroAutoplaySeconds" :min="1" :max="30" :step="0.5" size="small" />
              <span>segundos</span>
              <ElButton size="small" type="primary" plain :loading="savingHeroAutoplay" @click="saveHeroAutoplay">Guardar</ElButton>
            </div>

            <div v-if="loadingHeroSlides" class="empty-state">Cargando...</div>
            <div v-else-if="!heroSlides.length" class="empty-state">Sin slides aún.</div>

            <template v-else>
              <p class="section-hint" style="margin:-6px 0 14px;">Arrastra las tarjetas para reordenar. Click en la miniatura de un video para verlo en grande.</p>

              <div class="products-grid">
                <div
                  v-for="(slide, index) in heroSlides"
                  :key="slide.id"
                  class="product-card"
                  draggable="true"
                  @dragstart="onHeroDragStart(index)"
                  @dragover.prevent
                  @drop="onHeroDrop(index)"
                >
                <div class="product-preview" @click="slide.video ? openHeroPreview(slide) : null" :style="slide.video ? 'cursor:pointer' : ''">
                  <video v-if="slide.video" :src="slide.video" muted playsinline preload="metadata" />
                  <img v-else :src="slide.image" :alt="slide.alt_es">
                </div>
                <div class="product-info">
                  <strong>{{ slide.title_es || '(sin título)' }}</strong>
                  <span>{{ slide.video ? '🎬 Video' : '🖼️ Imagen' }}{{ slide.has_baked_text ? ' · texto incluido' : '' }}</span>
                  <span>Orden: {{ slide.sort_order }} · {{ slide.is_active ? 'Activo' : 'Inactivo' }}</span>
                </div>
                  <div class="product-actions">
                    <ElButton size="small" @click="openHeroSlide(slide)">Editar</ElButton>
                    <ElButton size="small" type="danger" @click="deleteHeroSlide(slide.id)">Eliminar</ElButton>
                  </div>
                </div>
              </div>
            </template>

            <ElDialog v-model="heroPreviewOpen" title="Vista previa del video" width="640px" @close="heroPreviewOpen = false">
              <video v-if="heroPreviewSlide?.video" :src="heroPreviewSlide.video" controls autoplay style="width:100%;border-radius:8px;" />
            </ElDialog>

            <ElDialog v-model="heroSlideEditorOpen" title="Slide del Home" width="720px" top="3vh">
              <div class="editor-stack">
                <div class="editor-grid-2col">
                  <div>
                    <label>Tipo de contenido</label>
                    <ElSelect v-model="editingHeroSlide.media_type">
                      <ElOption label="Imagen" value="image" />
                      <ElOption label="Video" value="video" />
                    </ElSelect>
                  </div>
                  <div>
                    <label>Orden</label>
                    <ElInputNumber v-model="editingHeroSlide.sort_order" :min="0" />
                  </div>
                </div>

                <div v-if="editingHeroSlide.media_type === 'image'">
                  <label>Imagen</label>
                  <div class="image-field">
                    <ElInput v-model="editingHeroSlide.image" placeholder="https://assets.sulafbc.com/..." />
                    <ElButton @click="openAssetBrowser('hero', '/images/slider_main')">📂 Directorio</ElButton>
                    <ElButton v-if="editingHeroSlide.image" type="danger" plain size="small" @click="editingHeroSlide.image = ''">✕</ElButton>
                  </div>
                  <img v-if="editingHeroSlide.image" :src="editingHeroSlide.image" alt="Slide" class="image-preview-thumb product">
                </div>

                <div v-else>
                  <label>Video (ES) — se usa también como respaldo si falta el de inglés</label>
                  <div class="image-field">
                    <ElInput v-model="editingHeroSlide.video" placeholder="https://assets.sulafbc.com/images/videos/..." />
                    <ElButton @click="openAssetBrowser('hero-video', '/images/videos', 'video')">📂 Biblioteca</ElButton>
                    <ElButton :loading="heroVideoUploading && heroVideoUploadTarget === 'video'" @click="triggerHeroVideoUpload('video')">⬆ Subir video</ElButton>
                    <ElButton v-if="editingHeroSlide.video" type="danger" plain size="small" @click="editingHeroSlide.video = ''">✕</ElButton>
                  </div>
                  <video v-if="editingHeroSlide.video" :src="editingHeroSlide.video" controls muted class="image-preview-thumb product" style="height:auto;max-height:220px;" />
                  <div v-if="heroVideoUploading && heroVideoUploadTarget === 'video'" class="upload-progress">
                    <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: heroVideoUploadProgress + '%' }" /></div>
                    <span class="upload-progress-label">Subiendo... {{ heroVideoUploadProgress }}%</span>
                  </div>

                  <label style="margin-top:14px;display:block;">Video (EN) — opcional, se muestra solo cuando el sitio está en inglés</label>
                  <div class="image-field">
                    <ElInput v-model="editingHeroSlide.video_en" placeholder="https://assets.sulafbc.com/images/videos/..." />
                    <ElButton @click="openAssetBrowser('hero-video-en', '/images/videos', 'video')">📂 Biblioteca</ElButton>
                    <ElButton :loading="heroVideoUploading && heroVideoUploadTarget === 'video_en'" @click="triggerHeroVideoUpload('video_en')">⬆ Subir video</ElButton>
                    <ElButton v-if="editingHeroSlide.video_en" type="danger" plain size="small" @click="editingHeroSlide.video_en = ''">✕</ElButton>
                  </div>
                  <video v-if="editingHeroSlide.video_en" :src="editingHeroSlide.video_en" controls muted class="image-preview-thumb product" style="height:auto;max-height:220px;" />
                  <div v-if="heroVideoUploading && heroVideoUploadTarget === 'video_en'" class="upload-progress">
                    <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: heroVideoUploadProgress + '%' }" /></div>
                    <span class="upload-progress-label">Subiendo... {{ heroVideoUploadProgress }}%</span>
                  </div>

                  <input ref="heroVideoUploadRef" type="file" accept="video/mp4,video/webm,video/quicktime" style="display:none" @change="handleHeroVideoUpload">
                  <div style="font-size:11px;color:#999;margin-top:6px;">Máx. 120 MB · formatos mp4, webm, mov</div>

                  <div class="publish-row" style="margin-top:14px;">
                    <ElSwitch v-model="editingHeroSlide.has_baked_text" active-text="El video ya trae el texto incluido" inactive-text="Necesita texto superpuesto" />
                  </div>
                </div>

                <div class="slider-section-divider">Texto superpuesto</div>
                <p v-if="editingHeroSlide.media_type === 'video' && editingHeroSlide.has_baked_text" class="seo-note">
                  Este video ya trae el texto quemado — el título de abajo no se mostrará sobre el slide.
                </p>

                <div class="editor-grid-2col">
                  <div>
                    <label>Título (ES)</label>
                    <ElInput v-model="editingHeroSlide.title_es" />
                  </div>
                  <div>
                    <label>Título (EN)</label>
                    <ElInput v-model="editingHeroSlide.title_en" />
                  </div>
                  <div>
                    <label>Alt / descripción (ES)</label>
                    <ElInput v-model="editingHeroSlide.alt_es" />
                  </div>
                  <div>
                    <label>Alt / descripción (EN)</label>
                    <ElInput v-model="editingHeroSlide.alt_en" />
                  </div>
                </div>

                <div class="editor-grid-2col">
                  <div>
                    <label>Posición del texto — Horizontal (X %)</label>
                    <ElInputNumber v-model="editingHeroSlide.overlay_x" :min="0" :max="100" placeholder="Auto" />
                  </div>
                  <div>
                    <label>Posición del texto — Vertical (Y %)</label>
                    <ElInputNumber v-model="editingHeroSlide.overlay_y" :min="0" :max="100" placeholder="Auto" />
                  </div>
                </div>
                <p class="seo-note">0% = arriba/izquierda, 100% = abajo/derecha. Déjalo vacío para usar la posición por defecto.</p>

                <div class="editor-grid-2col">
                  <div>
                    <label>Activo</label>
                    <ElSwitch v-model="editingHeroSlide.is_active" />
                  </div>
                </div>
              </div>
              <template #footer>
                <ElButton @click="heroSlideEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="saveHeroSlide" :loading="savingHeroSlide">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'slider' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Modelos de casa</h2>
                <p class="section-hint">Estos modelos se muestran en el home y en /modelos-de-casa.</p>
              </div>
              <ElButton type="primary" size="small" @click="openSliderProduct(null)">+ Nuevo modelo</ElButton>
            </div>

            <div class="products-grid">
              <div v-for="product in sliderProducts" :key="product.id" class="product-card">
                <div class="product-preview">
                  <img :src="product.image" :alt="product.name_es">
                </div>
                <div class="product-info">
                  <strong>{{ product.name_es }}</strong>
                  <span>{{ product.subtitle_es }}</span>
                  <span>Orden: {{ product.sort_order }}</span>
                </div>
                <div class="product-actions">
                  <ElButton size="small" @click="openSliderProduct(product)">Editar</ElButton>
                  <ElButton size="small" type="danger" @click="deleteSliderProduct(product.id)">Eliminar</ElButton>
                </div>
              </div>
            </div>

            <ElDialog v-model="sliderProductEditorOpen" title="Modelo de casa" width="720px" top="3vh">
              <div class="editor-stack">
                <div>
                  <label>Nombre del modelo</label>
                  <ElInput v-model="editingSliderProduct.name_es" placeholder="Ej. Oocarpa" />
                </div>
                <div>
                  <label>Slug (URL)</label>
                  <ElInput v-model="editingSliderProduct.slug" placeholder="oocarpa" />
                </div>
                <div>
                  <label>Imagen</label>
                  <div class="image-field">
                    <ElInput v-model="editingSliderProduct.image" placeholder="/images/modelos/..." />
                    <ElButton @click="openAssetBrowser('slider', '/images/modelos')">📂 Directorio</ElButton>
                    <ElButton v-if="editingSliderProduct.image" type="danger" plain size="small" @click="editingSliderProduct.image = ''">✕</ElButton>
                  </div>
                  <img v-if="editingSliderProduct.image" :src="editingSliderProduct.image" alt="Modelo" class="image-preview-thumb product">
                </div>
                <div class="editor-grid-2col">
                  <div>
                    <label>Orden</label>
                    <ElInputNumber v-model="editingSliderProduct.sort_order" :min="0" />
                  </div>
                  <div>
                    <label>Activo</label>
                    <ElSwitch v-model="editingSliderProduct.is_active" />
                  </div>
                </div>

                <div class="slider-section-divider">Información del modelo (detalle / popup)</div>

                <div class="editor-grid-2col">
                  <div>
                    <label>Proyecto / Colonia</label>
                    <ElInput v-model="editingSliderProduct.category_es" placeholder="Colonia El Circilar" />
                  </div>
                  <div>
                    <label>Resumen (dormitorios · baños · m²)</label>
                    <ElInput v-model="editingSliderProduct.subtitle_es" placeholder="97.55 m² · 3 dormitorios · 2 baños" />
                  </div>
                </div>
                <div>
                  <label>Frase corta de venta</label>
                  <ElInput v-model="editingSliderProduct.tagline_es" placeholder="Amplitud y comodidad para toda la familia" />
                </div>
                <div>
                  <label>Descripción completa</label>
                  <ElInput v-model="editingSliderProduct.description_es" type="textarea" :rows="3" />
                </div>

                <div class="slider-section-divider">Especificaciones</div>

                <div class="editor-grid-2col">
                  <div>
                    <label>Construcción (m²)</label>
                    <ElInput v-model="editingSliderProduct.format_es" placeholder="97.55 m²" />
                  </div>
                  <div>
                    <label>Dormitorios</label>
                    <ElInput v-model="editingSliderProduct.shelf_life_es" placeholder="3 dormitorios" />
                  </div>
                  <div>
                    <label>Baños</label>
                    <ElInput v-model="editingSliderProduct.store_temp" placeholder="2 baños" />
                  </div>
                  <div>
                    <label>Parqueos</label>
                    <ElInput v-model="editingSliderProduct.units_per_case" placeholder="1" />
                  </div>
                </div>
                <div style="margin-top:8px">
                  <label>Precio y notas de financiamiento</label>
                  <ElInput v-model="editingSliderProduct.logistics_es" placeholder="Precio referencial: consultar con un asesor. Financiamiento disponible." />
                </div>
              </div>
              <template #footer>
                <ElButton @click="sliderProductEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="saveSliderProduct" :loading="savingSliderProduct">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'faq' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Preguntas frecuentes</h2>
                <p class="section-hint">Se muestran en /contactanos y las usa el chatbot Julia como base de conocimiento.</p>
              </div>
              <ElButton type="primary" size="small" @click="openFaqEditor(null)">+ Nueva pregunta</ElButton>
            </div>

            <div v-if="loadingFaqs" class="empty-state">Cargando...</div>
            <div v-else-if="!faqs.length" class="empty-state">Sin preguntas aún.</div>
            <div v-else class="editor-stack">
              <div v-for="item in faqs" :key="item.id" class="settings-card" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                <div>
                  <strong>{{ item.q }}</strong>
                  <p class="seo-note" style="margin-top:6px;">{{ item.a }}</p>
                  <span class="seo-note">Orden: {{ item.sort_order }} · {{ item.is_active ? 'Activa' : 'Inactiva' }}</span>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <ElButton size="small" @click="openFaqEditor(item)">Editar</ElButton>
                  <ElButton size="small" type="danger" @click="deleteFaq(item.id)">Eliminar</ElButton>
                </div>
              </div>
            </div>

            <ElDialog v-model="faqEditorOpen" title="Pregunta frecuente" width="620px">
              <div class="editor-stack">
                <div>
                  <label>Pregunta</label>
                  <ElInput v-model="editingFaq.q" placeholder="¿Ya están construidas las casas?" />
                </div>
                <div>
                  <label>Respuesta</label>
                  <ElInput v-model="editingFaq.a" type="textarea" :rows="4" />
                </div>
                <div class="editor-grid-2col">
                  <div>
                    <label>Orden</label>
                    <ElInputNumber v-model="editingFaq.sort_order" :min="0" />
                  </div>
                  <div>
                    <label>Activa</label>
                    <ElSwitch v-model="editingFaq.is_active" />
                  </div>
                </div>
              </div>
              <template #footer>
                <ElButton @click="faqEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="saveFaq" :loading="savingFaq">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <!-- ── Multimedia ── -->
          <section v-if="tab === 'multimedia'">
            <div class="section-header">
              <div>
                <h2>Multimedia</h2>
                <p class="section-hint">Imágenes y videos organizados por carpeta (images/, videos/, etc). Click en un archivo para copiar su URL.</p>
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <ElInput v-model="mediaSearch" placeholder="Buscar archivo..." size="small" style="width:200px" clearable @input="mediaPage=1" />
                <ElButton size="small" type="primary" @click="triggerMediaUpload" :loading="mediaUploading">⬆ Subir archivo</ElButton>
                <input ref="mediaUploadRef" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple style="display:none" @change="handleMediaUpload">
              </div>
            </div>

            <div v-if="mediaUploading" class="upload-progress">
              <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: mediaUploadProgress + '%' }" /></div>
              <span class="upload-progress-label">Subiendo {{ mediaUploadFileLabel }} — {{ mediaUploadProgress }}%</span>
            </div>

            <div class="media-breadcrumb">
              <button class="crumb-btn" @click="loadMedia('/images')">📁 images</button>
              <span v-for="crumb in mediaBreadcrumb" :key="crumb.path" class="crumb-segment">
                <span class="crumb-sep">/</span>
                <button class="crumb-btn" @click="loadMedia(crumb.path)">{{ crumb.name }}</button>
              </span>
            </div>

            <div v-if="mediaLoading" class="empty-state">Cargando...</div>
            <div v-else>
              <div v-if="mediaDirectories.length" class="media-folders">
                <button v-for="dir in mediaDirectories" :key="dir.path" class="media-folder-btn" @click="loadMedia(dir.path)">
                  📁 {{ dir.name }}
                </button>
              </div>

              <div v-if="!paginatedMediaFiles.length && !mediaDirectories.length" class="empty-state">
                Sin archivos. Sube uno para comenzar.
              </div>
              <div v-else-if="paginatedMediaFiles.length" class="media-grid">
                <div
                  v-for="file in paginatedMediaFiles"
                  :key="file.path"
                  class="media-card"
                  :class="{ 'media-card-selected': mediaSelected?.path === file.path }"
                >
                  <div class="media-thumb-wrap" @click="selectMediaCard(file)">
                    <video v-if="file.type === 'video'" :src="file.url || file.path" muted playsinline preload="metadata" />
                    <img v-else :src="file.url || file.path" :alt="file.name" loading="lazy">
                    <span v-if="file.type === 'video'" class="media-video-badge">🎬</span>
                    <div class="media-overlay"><span>Copiar URL</span></div>
                  </div>
                  <div class="media-card-footer">
                    <span class="media-filename" :title="file.url || file.path">{{ file.name }}</span>
                    <button class="media-delete-btn" title="Eliminar" @click.stop="confirmDeleteMedia(file)">🗑</button>
                  </div>
                </div>
              </div>

              <div v-if="mediaTotalPages > 1" class="media-pagination">
                <ElButton size="small" :disabled="mediaPage <= 1" @click="mediaPage--">← Anterior</ElButton>
                <span class="media-page-info">{{ mediaPage }} / {{ mediaTotalPages }} &nbsp;·&nbsp; {{ filteredMediaFiles.length }} archivo{{ filteredMediaFiles.length !== 1 ? 's' : '' }}</span>
                <ElButton size="small" :disabled="mediaPage >= mediaTotalPages" @click="mediaPage++">Siguiente →</ElButton>
              </div>
              <div v-else-if="filteredMediaFiles.length" class="media-count">
                {{ filteredMediaFiles.length }} archivo{{ filteredMediaFiles.length !== 1 ? 's' : '' }}
              </div>
            </div>

            <Transition name="copy-toast">
              <div v-if="mediaCopyToast" class="media-copy-toast">✅ URL copiada al portapapeles</div>
            </Transition>
          </section>

          <section v-if="tab === 'users' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Usuarios</h2>
                <p class="section-hint">El rol `editor` queda enfocado a alimentar el blog. El `superadmin` administra todo.</p>
              </div>
              <ElButton type="primary" size="small" @click="openUser(null)">+ Nuevo usuario</ElButton>
            </div>

            <div class="users-list">
              <div v-for="user in users" :key="user.id" class="user-row">
                <div>
                  <strong>{{ user.email }}</strong>
                  <span>{{ user.role }}</span>
                </div>
                <div class="blog-row-actions">
                  <ElButton size="small" @click="openUser(user)">Editar</ElButton>
                  <ElButton size="small" type="danger" @click="deleteUser(user.id)">Eliminar</ElButton>
                </div>
              </div>
            </div>

            <ElDialog v-model="userEditorOpen" title="Usuario" width="560px">
              <div class="editor-stack">
                <div>
                  <label>Correo</label>
                  <ElInput v-model="editingUser.email" />
                </div>
                <div>
                  <label>Rol</label>
                  <ElSelect v-model="editingUser.role">
                    <ElOption label="superadmin" value="superadmin" />
                    <ElOption label="editor" value="editor" />
                  </ElSelect>
                </div>
                <div>
                  <label>Contraseña {{ editingUser.id ? '(opcional para actualizar)' : '' }}</label>
                  <ElInput v-model="editingUser.password" type="password" show-password />
                </div>
              </div>
              <template #footer>
                <ElButton @click="userEditorOpen = false">Cancelar</ElButton>
                <ElButton type="primary" @click="saveUser" :loading="savingUser">Guardar</ElButton>
              </template>
            </ElDialog>
          </section>

          <section v-if="tab === 'settings' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Configuración</h2>
                <p class="section-hint">Las claves SMTP y FTP siguen viviendo en `.env`. Desde aquí solo editas copias y plantillas.</p>
              </div>
              <ElButton type="primary" size="small" @click="saveSettings" :loading="savingSettings">Guardar configuración</ElButton>
            </div>

            <div v-if="loadingSettings" class="empty-state">Cargando...</div>

            <div v-else>
              <ElTabs v-model="settingsTab" class="settings-tabs">

                <!-- ── Tab 1: Configuración de Correo ── -->
                <ElTabPane label="Configuración de Correo" name="correo">
                  <div class="editor-stack settings-stack">
                    <div class="settings-card">
                      <label>Servidor SMTP (host)</label>
                      <ElInput v-model="settingsForm.smtp_host" placeholder="smtp.hostinger.com" />
                    </div>
                    <div class="editor-grid-2col">
                      <div class="settings-card">
                        <label>Puerto</label>
                        <ElInput v-model="settingsForm.smtp_port" placeholder="587" />
                      </div>
                      <div class="settings-card">
                        <label>Nombre remitente</label>
                        <ElInput v-model="settingsForm.smtp_from_name" placeholder="Sig-Urban Web" />
                      </div>
                    </div>
                    <div class="settings-card">
                      <label>Usuario SMTP</label>
                      <ElInput v-model="settingsForm.smtp_user" placeholder="info@sigurban.com" />
                    </div>
                    <div class="settings-card">
                      <label>Contraseña SMTP</label>
                      <ElInput v-model="settingsForm.smtp_pass" type="password" show-password placeholder="••••••••" />
                      <span class="seo-note">Se guarda en la base de datos, junto con el resto de la configuración del sitio.</span>
                    </div>
                    <div class="settings-card">
                      <label>Correo destinatario principal (TO)</label>
                      <ElInput
                        v-model="settingsForm.smtp_to"
                        placeholder="ej: info@sulafbc.com"
                        type="email"
                      />
                      <span class="seo-note">Este correo recibe directamente cada formulario enviado.</span>
                    </div>

                    <div class="settings-card">
                      <label>Copias de correo (CC)</label>
                      <ElInput
                        v-model="settingsForm.notification_cc"
                        placeholder="correo1@sitio.com, correo2@sitio.com"
                      />
                      <span class="seo-note">Se suman al destinatario principal cuando llega un formulario.</span>
                    </div>
                  </div>
                </ElTabPane>

                <!-- ── Tab 2: Plantillas ── -->
                <ElTabPane label="Plantillas" name="plantillas">
                  <div class="editor-stack settings-stack">
                    <div class="settings-card">
                      <div class="settings-card-header">
                        <label>Plantilla correo interno</label>
                        <div style="display:flex;gap:8px;">
                          <ElButton size="small" plain @click="applyDefaultAdminTemplate">Restaurar texto sugerido</ElButton>
                          <ElButton size="small" type="primary" plain @click="previewEmail('admin')">👁 Vista previa</ElButton>
                        </div>
                      </div>
                      <RichTextEditor
                        v-model="settingsForm.admin_template_html"
                        placeholder="Texto opcional arriba del detalle del formulario..."
                      />
                      <span class="seo-note">Aparece en el correo que recibe el equipo interno, arriba de los datos del formulario.</span>
                    </div>

                    <div class="settings-card">
                      <div class="settings-card-header">
                        <label>Plantilla correo externo (confirmación al usuario)</label>
                        <div style="display:flex;gap:8px;">
                          <ElButton size="small" plain @click="applyDefaultConfirmationTemplate">Restaurar texto sugerido</ElButton>
                          <ElButton size="small" type="primary" plain @click="previewEmail('confirmation')">👁 Vista previa</ElButton>
                        </div>
                      </div>
                      <RichTextEditor
                        v-model="settingsForm.confirmation_template_html"
                        placeholder="Texto opcional para la respuesta automática al usuario..."
                      />
                      <span class="seo-note">Va en la respuesta automática que recibe la persona que envió el formulario.</span>
                    </div>
                  </div>
                </ElTabPane>

                <!-- ── Tab 3: Redes Sociales ── -->
                <ElTabPane label="Redes Sociales" name="redes">
                  <div class="editor-stack settings-stack">
                    <div class="settings-card">
                      <label>Instagram — Access Token</label>
                      <ElInput
                        v-model="settingsForm.instagram_token"
                        type="password"
                        show-password
                        placeholder="Pega aquí el token de acceso de Instagram Graph API"
                      />
                      <span class="seo-note">
                        Token de larga duración (~60 días). Para obtenerlo: Meta for Developers → My Apps → Instagram Basic Display → Generate Token.
                        Cuando expire, genera uno nuevo y pégalo aquí.
                      </span>
                    </div>

                    <div class="settings-card">
                      <label>Facebook — Page Access Token</label>
                      <ElInput
                        v-model="settingsForm.facebook_token"
                        type="password"
                        show-password
                        placeholder="Pega aquí el token de página de Facebook"
                      />
                      <span class="seo-note">
                        Token de página de larga duración. Obtenible desde Meta for Developers → Graph API Explorer → Generate Access Token.
                      </span>
                    </div>
                  </div>
                </ElTabPane>

                <!-- ── Tab 4: General ── -->
                <ElTabPane label="General" name="general">
                  <div class="editor-stack settings-stack">
                    <div class="settings-card">
                      <label>Número de WhatsApp (con código de país, sin +)</label>
                      <ElInput v-model="settingsForm.whatsapp_number" placeholder="50431731754" />
                      <span class="seo-note">Se usa en el botón flotante de WhatsApp y en los mensajes del chatbot.</span>
                    </div>
                    <div class="settings-card">
                      <label>Código promocional</label>
                      <ElInput v-model="settingsForm.promo_code" placeholder="#FBSIGURBAN" />
                    </div>
                    <div class="settings-card">
                      <label>Google Analytics — Measurement ID</label>
                      <ElInput v-model="settingsForm.ga_measurement_id" placeholder="G-XXXXXXXXXX" />
                      <span class="seo-note">Deja vacío para desactivar Google Analytics.</span>
                    </div>
                    <div class="settings-card">
                      <label>Enlaces permanentes del blog</label>
                      <ElSelect v-model="settingsForm.blog_permalink_mode" style="width:100%;">
                        <ElOption label="Por fecha — /AAAA/MM/DD/titulo (igual que WordPress)" value="date" />
                        <ElOption label="Por categoría — /blog/categoria/titulo" value="category" />
                        <ElOption label="Simple — /blog/titulo" value="simple" />
                      </ElSelect>
                      <span class="seo-note">"Por fecha" mantiene la misma estructura de URL que el sitio actual en WordPress (mejor para no perder posicionamiento).</span>
                    </div>

                    <div class="settings-card">
                      <label>Imagen Open Graph por defecto</label>
                      <span class="seo-note">Se usa como vista previa al compartir el sitio en Facebook/WhatsApp/Twitter en las páginas que no tienen imagen propia (inicio, quiénes somos, contacto, listados). Recomendado 1200×630px.</span>
                      <div style="display:flex;gap:8px;align-items:flex-start;margin-top:8px;">
                        <ElInput v-model="settingsForm.og_image" placeholder="https://apiuploads.sigurban.com/storage-api/..." />
                        <ElButton size="small" @click="openAssetBrowser('og-image', '/images')">📂</ElButton>
                      </div>
                      <img v-if="settingsForm.og_image" :src="settingsForm.og_image" style="margin-top:10px;max-width:280px;border-radius:8px;border:1px solid var(--border);" />
                    </div>

                    <div class="settings-card">
                      <div class="settings-card-header">
                        <label>Citas de los banners CTA</label>
                        <ElButton size="small" plain @click="addCtaQuote">+ Nueva cita</ElButton>
                      </div>
                      <span class="seo-note">Se muestran al azar en los banners de "Agenda tu visita" del sitio.</span>
                      <div v-for="(q, i) in ctaQuotes" :key="i" class="cta-quote-row">
                        <ElInput v-model="q.title" placeholder="Título" size="small" />
                        <ElInput v-model="q.text" placeholder="Texto" size="small" />
                        <ElInput v-model="q.cta" placeholder="Texto del botón" size="small" style="max-width:180px;" />
                        <ElButton size="small" type="danger" plain @click="removeCtaQuote(i)">✕</ElButton>
                      </div>
                    </div>

                    <div class="settings-card">
                      <div class="settings-card-header">
                        <label>Instituciones financieras aliadas</label>
                        <ElButton size="small" plain @click="addBankPartner">+ Nuevo banco</ElButton>
                      </div>
                      <span class="seo-note">Se muestran en el home, debajo de "Modelos de casas". El logo es opcional — si lo dejás vacío se muestra solo el nombre.</span>
                      <div v-for="(b, i) in bankPartnersForm" :key="i" class="cta-quote-row">
                        <ElInput v-model="b.name" placeholder="Nombre del banco" size="small" style="max-width:180px;" />
                        <ElInput v-model="b.logo" placeholder="URL del logo (opcional)" size="small" />
                        <ElButton size="small" @click="openAssetBrowser('bank-logo-' + i, '/images/banks')">📂</ElButton>
                        <ElButton size="small" type="danger" plain @click="removeBankPartner(i)">✕</ElButton>
                      </div>
                    </div>
                  </div>
                </ElTabPane>

              </ElTabs>
            </div>
          </section>

          <section v-if="tab === 'chatbot' && isSuperadmin">
            <div class="section-header">
              <div>
                <h2>Chatbot (Julia)</h2>
                <p class="section-hint">Editá el prompt del asesor digital y a dónde se envían los leads precalificados. No requiere N8N para responder — solo para reenviar leads al CRM si lo configurás.</p>
              </div>
              <ElButton type="primary" size="small" @click="saveSettings" :loading="savingSettings">Guardar</ElButton>
            </div>

            <div v-if="loadingSettings" class="empty-state">Cargando...</div>
            <div v-else class="editor-stack settings-stack">
              <div class="settings-card">
                <label>Chatbot activo</label>
                <ElSwitch v-model="chatbotEnabledBool" active-text="Activo" inactive-text="Apagado" />
              </div>

              <div class="settings-card">
                <div class="settings-card-header">
                  <label>Prompt del sistema (personalidad y reglas de Julia)</label>
                  <ElButton size="small" plain @click="restoreDefaultChatbotPrompt">Restaurar prompt por defecto</ElButton>
                </div>
                <ElInput
                  v-model="settingsForm.chatbot_system_prompt"
                  type="textarea"
                  :rows="18"
                  placeholder="Prompt del sistema..."
                />
                <span class="seo-note">Este texto define cómo responde Julia. Los datos del proyecto (precio, requisitos, FAQ) se toman de /admin → Proyectos y Modelos de casa.</span>
              </div>

              <div class="settings-card">
                <label>Endpoint del CRM (envío directo del lead)</label>
                <ElInput v-model="settingsForm.crm_lead_endpoint" placeholder="https://api.crm.sigurban.com/api/leads/chatbot" />
                <span class="seo-note">Cuando el cliente confirma sus datos, el chatbot llama a esta URL con { name, dni, phone }.</span>
              </div>

              <div class="settings-card">
                <label>Webhook de N8N (opcional)</label>
                <ElInput v-model="settingsForm.n8n_lead_webhook_url" placeholder="https://n8n.sigurban.com/webhook/..." />
                <span class="seo-note">Si se define, el lead se envía a N8N en vez del CRM directo, y N8N se encarga de reenviarlo al CRM.</span>
              </div>
            </div>
          </section>

          <!-- ── Vista previa de correo ── -->
          <ElDialog v-model="emailPreviewOpen" :title="emailPreviewTitle" width="680px" top="4vh">
            <div v-if="emailPreviewLoading" style="text-align:center;padding:40px;color:#999;">Generando vista previa...</div>
            <div v-else>
              <iframe
                :srcdoc="emailPreviewHtml"
                style="width:100%;height:600px;border:1px solid #e2e8f0;border-radius:8px;background:white;"
                sandbox="allow-same-origin"
              />
            </div>
          </ElDialog>

          <ElDialog v-model="assetBrowserOpen" :title="assetMediaType === 'video' ? 'Seleccionar video' : 'Seleccionar imagen'" width="900px">
            <div class="asset-toolbar">
              <div style="display:flex;align-items:center;gap:12px;flex:1;">
                <div class="asset-path">{{ assetDirectory }}</div>
                <ElInput v-model="assetSearch" placeholder="Buscar..." size="small" style="width:160px" clearable />
              </div>
              <div class="asset-toolbar-actions">
                <ElButton v-if="assetParentDirectory" size="small" @click="loadAssets(assetParentDirectory)">↑ Subir nivel</ElButton>
                <ElButton size="small" :loading="assetUploading" @click="triggerAssetUpload">⬆ {{ assetMediaType === 'video' ? 'Subir video' : 'Subir imagen' }}</ElButton>
                <input
                  ref="assetUploadRef"
                  type="file"
                  :accept="assetMediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'"
                  style="display:none"
                  @change="handleAssetUpload"
                >
              </div>
            </div>
            <div style="font-size:11px;color:#999;margin:-10px 0 14px;">
              {{ assetMediaType === 'video' ? 'Máx. 120 MB · formatos mp4, webm, mov' : 'Máx. 4 MB por imagen — el servidor la optimiza automáticamente a ≤ 2 MB' }}
            </div>
            <div v-if="assetUploading" class="upload-progress" style="margin:-6px 0 14px;">
              <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: assetUploadProgress + '%' }" /></div>
              <span class="upload-progress-label">Subiendo... {{ assetUploadProgress }}%</span>
            </div>

            <div class="asset-layout">
              <div>
                <h3>Carpetas</h3>
                <div class="asset-list">
                  <button
                    v-for="directory in assetDirectories"
                    :key="directory.path"
                    type="button"
                    class="asset-entry folder"
                    @click="loadAssets(directory.path)"
                  >
                    📁 {{ directory.name }}
                  </button>
                  <div v-if="!assetDirectories.length" class="asset-empty">Sin carpetas</div>
                </div>
              </div>

              <div>
                <h3>{{ assetMediaType === 'video' ? 'Videos' : 'Imágenes' }}</h3>
                <div class="asset-grid">
                  <button
                    v-for="file in filteredAssetFiles"
                    :key="file.path"
                    type="button"
                    class="asset-card"
                    @click="selectAsset(file.url || file.path)"
                  >
                    <video v-if="assetMediaType === 'video'" :src="file.url || file.path" muted playsinline preload="metadata" />
                    <img v-else :src="file.url || file.path" :alt="file.name">
                    <span>{{ file.name }}</span>
                  </button>
                  <div v-if="!filteredAssetFiles.length" class="asset-empty">{{ assetMediaType === 'video' ? 'No hay videos en esta carpeta' : 'No hay imágenes en esta carpeta' }}</div>
                </div>
              </div>
            </div>
          </ElDialog>
        </main>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  ElInput, ElButton, ElMessage, ElDialog, ElSwitch, ElSelect, ElOption,
  ElTabs, ElTabPane, ElInputNumber
} from 'element-plus'
import RichTextEditor from '../components/RichTextEditor.vue'
import { DEFAULT_CHATBOT_SYSTEM_PROMPT } from '../utils/chatbotDefaults'

const AUTH_KEY = 'sigurban_admin_auth'
const DEFAULT_ADMIN_TEMPLATE_HTML = `
<p>Se recibió un nuevo formulario desde <strong>sulafbc.com</strong>.</p>
<p>Favor revisar los datos enviados por el usuario y dar seguimiento según el tipo de solicitud.</p>
<p><strong>Sugerencia interna:</strong> responder dentro del mismo día hábil y registrar cualquier seguimiento comercial o de servicio.</p>
`
const DEFAULT_CONFIRMATION_TEMPLATE_HTML = `
<p>Gracias por escribirnos a <strong>SULAFBC</strong>.</p>
<p>Recibimos tu mensaje correctamente y nuestro equipo lo estará revisando para responderte lo antes posible.</p>
<p>Si tu solicitud está relacionada con distribución, productos o información comercial, te estaremos contactando por correo o teléfono con los próximos pasos.</p>
`

const auth = ref({
  token: '',
  user: null,
})

const loginForm = ref({ email: '', password: '' })
const loginError = ref('')
const loggingIn = ref(false)
const tab = ref('blog')

const submissions = ref([])
const loadingSubmissions = ref(false)
const subsPage = ref(1)
const SUBS_PER_PAGE = 10
const selectedIds = ref(new Set())
const deletingSubmissions = ref(false)

const blogPosts = ref([])
const loadingBlog = ref(false)
const savingPost = ref(false)
const postEditorOpen = ref(false)
const editorTab = ref('es')
const editingPost = ref(emptyPost())

const products = ref([])
const savingProduct = ref(false)
const productEditorOpen = ref(false)
const editingProduct = ref(emptyProduct())

const sliderProducts = ref([])
const loadingSliderProducts = ref(false)
const savingSliderProduct = ref(false)
const sliderProductEditorOpen = ref(false)
const editingSliderProduct = ref(emptySliderProduct())

const faqs = ref([])
const loadingFaqs = ref(false)
const savingFaq = ref(false)
const faqEditorOpen = ref(false)
const editingFaq = ref(emptyFaq())

const heroSlides = ref([])
const loadingHeroSlides = ref(false)
const savingHeroSlide = ref(false)
const heroSlideEditorOpen = ref(false)
const editingHeroSlide = ref(emptyHeroSlide())
const heroVideoUploadRef = ref(null)
const heroVideoUploadTarget = ref('video')
const heroVideoUploading = ref(false)
const heroVideoUploadProgress = ref(0)
const heroAutoplaySeconds = ref(4.5)
const savingHeroAutoplay = ref(false)
const heroPreviewOpen = ref(false)
const heroPreviewSlide = ref(null)
let heroDragIndex = null

const users = ref([])
const savingUser = ref(false)
const userEditorOpen = ref(false)
const editingUser = ref(emptyUser())

const settingsForm = ref({
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from_name: 'Sig-Urban Web',
  smtp_to: '',
  notification_cc: '',
  admin_template_html: '',
  confirmation_template_html: '',
  instagram_token: '',
  facebook_token: '',
  hero_autoplay_seconds: '4.5',
  ga_measurement_id: '',
  whatsapp_number: '',
  promo_code: '',
  chatbot_system_prompt: '',
  chatbot_enabled: '1',
  n8n_lead_webhook_url: '',
  crm_lead_endpoint: '',
  blog_permalink_mode: 'date',
  cta_quotes_json: '',
  bank_partners_json: '',
  og_image: '',
})
const settingsTab = ref('correo')
const chatbotEnabledBool = computed({
  get: () => settingsForm.value.chatbot_enabled === '1',
  set: (val) => { settingsForm.value.chatbot_enabled = val ? '1' : '0' },
})

const ctaQuotes = ref([])
function addCtaQuote() {
  ctaQuotes.value.push({ title: '', text: '', cta: 'Quiero aplicar' })
}
function removeCtaQuote(index) {
  ctaQuotes.value.splice(index, 1)
}
const bankPartnersForm = ref([])
function addBankPartner() {
  bankPartnersForm.value.push({ name: '', logo: '' })
}
function removeBankPartner(index) {
  bankPartnersForm.value.splice(index, 1)
}
function restoreDefaultChatbotPrompt() {
  settingsForm.value.chatbot_system_prompt = DEFAULT_CHATBOT_SYSTEM_PROMPT
}
const loadingSettings = ref(false)
const savingSettings = ref(false)

// ── Submissions detail & export ──────────────────────────────
const submissionDetailOpen = ref(false)
const selectedSubmission = ref(null)
const submissionFields = [
  ['Negocio / Nombre', 'name'],
  ['Contacto', 'contact'],
  ['Email', 'email'],
  ['Teléfono', 'phone'],
  ['Dirección', 'address'],
  ['Estado', 'state'],
  ['Empresa', 'company'],
  ['Asunto', 'subject'],
  ['Productos de interés', 'product_interest'],
  ['Mensaje', 'message'],
]

const emailPreviewOpen = ref(false)
const emailPreviewLoading = ref(false)
const emailPreviewHtml = ref('')
const emailPreviewTitle = ref('Vista previa del correo')

const assetBrowserOpen = ref(false)
const assetTarget = ref('post')
const assetMediaType = ref('image')
const assetDirectory = ref('/images')
const assetParentDirectory = ref(null)
const assetDirectories = ref([])
const assetFiles = ref([])
const assetUploadRef = ref(null)
const assetUploading = ref(false)
const assetUploadProgress = ref(0)
const assetSearch = ref('')

// Multimedia section
const mediaDirectory = ref('/images')
const mediaDirectories = ref([])
const mediaFiles = ref([])
const mediaLoading = ref(false)
const mediaUploading = ref(false)
const mediaUploadProgress = ref(0)
const mediaUploadFileLabel = ref('')
const mediaSearch = ref('')
const mediaPage = ref(1)
const mediaUploadRef = ref(null)
const mediaSelected = ref(null)
const mediaCopyToast = ref(false)

const MEDIA_PER_PAGE = 24

const mediaBreadcrumb = computed(() => {
  const parts = mediaDirectory.value.split('/').filter(Boolean)
  const result = []
  let current = ''
  for (const part of parts) {
    current += '/' + part
    result.push({ name: part, path: current })
  }
  return result.slice(1)
})

const filteredAssetFiles = computed(() => {
  if (!assetSearch.value) return assetFiles.value
  const q = assetSearch.value.toLowerCase()
  return assetFiles.value.filter((f) => f.name.toLowerCase().includes(q))
})

const filteredMediaFiles = computed(() => {
  if (!mediaSearch.value) return mediaFiles.value
  const q = mediaSearch.value.toLowerCase()
  return mediaFiles.value.filter((f) => f.name.toLowerCase().includes(q))
})

const mediaTotalPages = computed(() => Math.max(1, Math.ceil(filteredMediaFiles.value.length / MEDIA_PER_PAGE)))

const paginatedMediaFiles = computed(() => {
  const start = (mediaPage.value - 1) * MEDIA_PER_PAGE
  return filteredMediaFiles.value.slice(start, start + MEDIA_PER_PAGE)
})

const isSuperadmin = computed(() => auth.value.user?.role === 'superadmin')

const seoPreview = computed(() => ({
  es: {
    title: editingPost.value.title_es || editingPost.value.title_en || 'SULAFBC',
    description: buildExcerpt(editingPost.value.excerpt_es || editingPost.value.content_es || editingPost.value.title_es),
  },
  en: {
    title: editingPost.value.title_en || editingPost.value.title_es || 'SULAFBC',
    description: buildExcerpt(editingPost.value.excerpt_en || editingPost.value.content_en || editingPost.value.title_en),
  },
}))

function emptyPost() {
  return {
    id: null,
    slug: '',
    title_es: '',
    title_en: '',
    excerpt_es: '',
    excerpt_en: '',
    content_es: '',
    content_en: '',
    image: '',
    category: 'Recetas',
    external_url: '',
    product_id: null,
    published: true,
  }
}

function emptyProduct() {
  return {
    id: null,
    slug: '',
    name_es: '',
    name_en: '',
    image: '',
    sort_order: 0,
    is_active: true,
    location_es: '',
    description_es: '',
    description_long_es: '',
    badge_es: 'Disponible',
    maps_url: '',
  }
}

function emptyFaq() {
  return {
    id: null,
    q: '',
    a: '',
    sort_order: 0,
    is_active: true,
  }
}

function emptySliderProduct() {
  return {
    id: null,
    slug: '',
    name_es: '',
    name_en: '',
    image: '',
    sort_order: 0,
    is_active: true,
    category: '',
    category_es: '',
    category_en: '',
    subtitle: '',
    subtitle_es: '',
    subtitle_en: '',
    tagline_es: '',
    tagline_en: '',
    description_es: '',
    description_en: '',
    format: '',
    format_es: '',
    shelf_life: '',
    shelf_life_es: '',
    store_temp: '',
    units_per_case: '',
    logistics: '',
    logistics_es: '',
    gallery: [],
  }
}

function emptyHeroSlide() {
  return {
    id: null,
    media_type: 'image',
    image: '',
    video: '',
    video_en: '',
    title_es: '',
    title_en: '',
    alt_es: '',
    alt_en: '',
    image_class: '',
    title_class: '',
    has_baked_text: false,
    overlay_x: null,
    overlay_y: null,
    sort_order: 0,
    is_active: true,
  }
}

function emptyUser() {
  return {
    id: null,
    email: '',
    role: 'editor',
    password: '',
  }
}

function navClass(name) {
  return ['nav-item', { active: tab.value === name }]
}

function applyDefaultAdminTemplate() {
  settingsForm.value.admin_template_html = DEFAULT_ADMIN_TEMPLATE_HTML.trim()
}

function applyDefaultConfirmationTemplate() {
  settingsForm.value.confirmation_template_html = DEFAULT_CONFIRMATION_TEMPLATE_HTML.trim()
}

async function previewEmail(templateType) {
  emailPreviewTitle.value = templateType === 'admin'
    ? 'Vista previa — Correo interno (al equipo)'
    : 'Vista previa — Correo de confirmación (al usuario)'
  emailPreviewHtml.value = ''
  emailPreviewLoading.value = true
  emailPreviewOpen.value = true

  try {
    const customHtml = templateType === 'admin'
      ? settingsForm.value.admin_template_html
      : settingsForm.value.confirmation_template_html

    const res = await $fetch('/api/email-preview', {
      method: 'POST',
      body: { template: templateType, type: 'distributor', customMessageHtml: customHtml },
    })
    emailPreviewHtml.value = res.html || '<p>Sin contenido</p>'
  } catch {
    emailPreviewHtml.value = '<p style="color:red;padding:20px;">Error generando la vista previa.</p>'
  } finally {
    emailPreviewLoading.value = false
  }
}

async function adminFetch(url, options = {}) {
  try {
    return await $fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-token': auth.value.token,
      },
    })
  } catch (error) {
    const status = error?.response?.status ?? error?.statusCode
    if (status === 401) {
      auth.value = { token: '', user: null }
      localStorage.removeItem(AUTH_KEY)
      tab.value = 'blog'
      ElMessage.warning('Sesión expirada. Por favor vuelve a iniciar sesión.')
      return
    }
    console.error(`[admin] Error en ${url}:`, error)
    throw error
  }
}

function persistAuth() {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth.value))
}

function restoreAuth() {
  const saved = localStorage.getItem(AUTH_KEY)
  if (!saved) return
  auth.value = JSON.parse(saved)
  const defaultTab = auth.value.user?.role === 'editor' ? 'blog' : 'submissions'
  const hashTab = location.hash.replace('#', '')
  tab.value = hashTab && tabAllowed(hashTab) ? hashTab : defaultTab
}

async function login() {
  loggingIn.value = true
  loginError.value = ''
  try {
    const res = await $fetch('/api/admin/login', {
      method: 'POST',
      body: loginForm.value,
    })
    if (!res.ok) {
      loginError.value = res.error || 'No se pudo iniciar sesión'
      return
    }
    auth.value = { token: res.token, user: res.user }
    persistAuth()
    const hashTab = location.hash.replace('#', '')
    tab.value = hashTab && tabAllowed(hashTab) ? hashTab : (res.user.role === 'editor' ? 'blog' : 'submissions')
    history.replaceState(null, '', `#${tab.value}`)
    await bootAdmin()
    if (tab.value === 'multimedia') await loadMedia('/images')
  } catch (err) {
    console.error('[admin/login] Error al iniciar sesión:', err)
    loginError.value = err?.data?.error || 'No se pudo iniciar sesión'
  } finally {
    loggingIn.value = false
  }
}

async function logout() {
  try {
    if (auth.value.token) {
      await adminFetch('/api/admin/logout', { method: 'POST' })
    }
  } catch {}
  auth.value = { token: '', user: null }
  localStorage.removeItem(AUTH_KEY)
  tab.value = 'blog'
  history.replaceState(null, '', location.pathname)
}

async function bootAdmin() {
  await loadBlog()
  if (isSuperadmin.value) {
    await Promise.all([loadProducts(), loadSliderProducts(), loadHeroSlides(), loadUsers(), loadSubmissions(), loadSettings()])
  } else {
    await loadProducts()
  }
}

const SUPERADMIN_ONLY_TABS = ['submissions', 'products', 'hero', 'slider', 'faq', 'users', 'settings', 'chatbot']
const VALID_TABS = ['submissions', 'blog', 'products', 'hero', 'slider', 'faq', 'multimedia', 'users', 'settings', 'chatbot']

function tabAllowed(name) {
  if (!VALID_TABS.includes(name)) return false
  if (SUPERADMIN_ONLY_TABS.includes(name) && !isSuperadmin.value) return false
  return true
}

async function openTab(nextTab, options = {}) {
  tab.value = nextTab
  if (process.client && !options.skipHash) {
    history.replaceState(null, '', `#${nextTab}`)
  }
  if (nextTab === 'blog') await Promise.all([loadBlog(), loadProducts()])
  if (nextTab === 'products' && isSuperadmin.value) await loadProducts()
  if (nextTab === 'hero' && isSuperadmin.value) await Promise.all([loadHeroSlides(), loadSettings()])
  if (nextTab === 'slider' && isSuperadmin.value) await loadSliderProducts()
  if (nextTab === 'faq' && isSuperadmin.value) await loadFaqs()
  if (nextTab === 'users' && isSuperadmin.value) await loadUsers()
  if (nextTab === 'submissions' && isSuperadmin.value) await loadSubmissions()
  if (nextTab === 'settings' && isSuperadmin.value) await loadSettings()
  if (nextTab === 'chatbot' && isSuperadmin.value) await loadSettings()
  if (nextTab === 'multimedia') await loadMedia('/images')
}

function handleHashChange() {
  const nextTab = location.hash.replace('#', '')
  if (nextTab && nextTab !== tab.value && tabAllowed(nextTab)) {
    openTab(nextTab, { skipHash: true })
  }
}

async function loadSubmissions() {
  loadingSubmissions.value = true
  try {
    const res = await adminFetch('/api/submissions')
    submissions.value = res.data || []
    subsPage.value = 1
    selectedIds.value = new Set()
  } catch {
    ElMessage.error('Error al cargar formularios')
  } finally {
    loadingSubmissions.value = false
  }
}

function viewSubmission(item) {
  selectedSubmission.value = item
  submissionDetailOpen.value = true
}

function buildXlsRows(rows) {
  const headers = ['ID', 'Tipo', 'Fecha', 'Negocio', 'Contacto', 'Email', 'Teléfono', 'Dirección', 'Estado', 'Empresa', 'Asunto', 'Productos', 'Mensaje']
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.id, r.type, r.created_at, r.name, r.contact, r.email,
      r.phone, r.address, r.state, r.company, r.subject, r.product_interest, r.message,
    ].map(escape).join(',')),
  ]
  return lines.join('\r\n')
}

function downloadCsv(content, filename) {
  const bom = '﻿' // UTF-8 BOM for Excel
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportXLS() {
  if (!submissions.value.length) return
  downloadCsv(buildXlsRows(submissions.value), `sulafbc-formularios-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportSingleXLS(item) {
  if (!item) return
  downloadCsv(buildXlsRows([item]), `sulafbc-formulario-${item.id}.csv`)
}

// ── Submissions pagination & selection ──────────────────────
const submissionsTotalPages = computed(() => Math.max(1, Math.ceil(submissions.value.length / SUBS_PER_PAGE)))

const paginatedSubmissions = computed(() => {
  const start = (subsPage.value - 1) * SUBS_PER_PAGE
  return submissions.value.slice(start, start + SUBS_PER_PAGE)
})

const isAllPageSelected = computed(() =>
  paginatedSubmissions.value.length > 0 &&
  paginatedSubmissions.value.every((s) => selectedIds.value.has(s.id))
)

const isSomePageSelected = computed(() =>
  paginatedSubmissions.value.some((s) => selectedIds.value.has(s.id))
)

function toggleSelectAll() {
  const ids = paginatedSubmissions.value.map((s) => s.id)
  if (isAllPageSelected.value) {
    const next = new Set(selectedIds.value)
    ids.forEach((id) => next.delete(id))
    selectedIds.value = next
  } else {
    const next = new Set(selectedIds.value)
    ids.forEach((id) => next.add(id))
    selectedIds.value = next
  }
}

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}

async function deleteSelected() {
  if (!selectedIds.value.size) return
  const count = selectedIds.value.size
  const ok = window.confirm(`¿Eliminar ${count} formulario${count !== 1 ? 's' : ''}?`)
  if (!ok) return
  deletingSubmissions.value = true
  try {
    await adminFetch('/api/admin/delete-submissions', {
      method: 'POST',
      body: { ids: [...selectedIds.value] },
    })
    submissions.value = submissions.value.filter((s) => !selectedIds.value.has(s.id))
    selectedIds.value = new Set()
    if (subsPage.value > submissionsTotalPages.value) subsPage.value = submissionsTotalPages.value
    ElMessage.success(`${count} formulario${count !== 1 ? 's' : ''} eliminado${count !== 1 ? 's' : ''}`)
  } catch {
    ElMessage.error('Error al eliminar formularios')
  } finally {
    deletingSubmissions.value = false
  }
}

async function deleteSingle(id) {
  const ok = window.confirm('¿Eliminar este formulario?')
  if (!ok) return
  deletingSubmissions.value = true
  try {
    await adminFetch('/api/admin/delete-submissions', {
      method: 'POST',
      body: { ids: [id] },
    })
    submissions.value = submissions.value.filter((s) => s.id !== id)
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
    if (subsPage.value > submissionsTotalPages.value) subsPage.value = submissionsTotalPages.value
    ElMessage.success('Formulario eliminado')
  } catch {
    ElMessage.error('Error al eliminar')
  } finally {
    deletingSubmissions.value = false
  }
}

async function loadBlog() {
  loadingBlog.value = true
  try {
    const res = await adminFetch('/api/blog-admin', { method: 'POST', body: { action: 'list' } })
    blogPosts.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar publicaciones')
  } finally {
    loadingBlog.value = false
  }
}

async function loadProducts() {
  try {
    const res = isSuperadmin.value
      ? await adminFetch('/api/products-admin', { method: 'POST', body: { action: 'list' } })
      : await $fetch('/api/products')
    products.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar productos')
  }
}

async function loadFaqs() {
  loadingFaqs.value = true
  try {
    const res = await adminFetch('/api/faq-admin', { method: 'POST', body: { action: 'list' } })
    faqs.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar preguntas frecuentes')
  } finally {
    loadingFaqs.value = false
  }
}

function openFaqEditor(item) {
  editingFaq.value = item ? { ...emptyFaq(), ...item, is_active: !!item.is_active } : emptyFaq()
  faqEditorOpen.value = true
}

async function saveFaq() {
  savingFaq.value = true
  try {
    const action = editingFaq.value.id ? 'update' : 'create'
    await adminFetch('/api/faq-admin', { method: 'POST', body: { action, faq: editingFaq.value } })
    faqEditorOpen.value = false
    await loadFaqs()
    ElMessage.success('Guardado')
  } catch {
    ElMessage.error('Error al guardar')
  } finally {
    savingFaq.value = false
  }
}

async function deleteFaq(id) {
  try {
    await adminFetch('/api/faq-admin', { method: 'POST', body: { action: 'delete', faq: { id } } })
    await loadFaqs()
  } catch {
    ElMessage.error('Error al eliminar')
  }
}

async function loadSliderProducts() {
  loadingSliderProducts.value = true
  try {
    const res = isSuperadmin.value
      ? await adminFetch('/api/slider-products-admin', { method: 'POST', body: { action: 'list' } })
      : await $fetch('/api/slider-products')
    sliderProducts.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar slider de productos')
  } finally {
    loadingSliderProducts.value = false
  }
}

async function loadHeroSlides() {
  loadingHeroSlides.value = true
  try {
    const res = await adminFetch('/api/hero-slides-admin', { method: 'POST', body: { action: 'list' } })
    heroSlides.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar el slider principal')
  } finally {
    loadingHeroSlides.value = false
  }
}

async function loadUsers() {
  try {
    const res = await adminFetch('/api/admin/users', { method: 'POST', body: { action: 'list' } })
    users.value = res.data || []
  } catch {
    ElMessage.error('Error al cargar usuarios')
  }
}

async function loadSettings() {
  loadingSettings.value = true
  try {
    const res = await adminFetch('/api/settings-admin', { method: 'POST', body: { action: 'get' } })
    settingsForm.value = {
      smtp_host: res.data?.smtp_host || '',
      smtp_port: res.data?.smtp_port || '587',
      smtp_user: res.data?.smtp_user || '',
      smtp_pass: res.data?.smtp_pass || '',
      smtp_from_name: res.data?.smtp_from_name || 'Sig-Urban Web',
      smtp_to: res.data?.smtp_to || '',
      notification_cc: res.data?.notification_cc || '',
      admin_template_html: res.data?.admin_template_html || DEFAULT_ADMIN_TEMPLATE_HTML.trim(),
      confirmation_template_html: res.data?.confirmation_template_html || DEFAULT_CONFIRMATION_TEMPLATE_HTML.trim(),
      instagram_token: res.data?.instagram_token || '',
      facebook_token: res.data?.facebook_token || '',
      hero_autoplay_seconds: res.data?.hero_autoplay_seconds || '4.5',
      ga_measurement_id: res.data?.ga_measurement_id || '',
      whatsapp_number: res.data?.whatsapp_number || '50431731754',
      promo_code: res.data?.promo_code || '#FBSIGURBAN',
      chatbot_system_prompt: res.data?.chatbot_system_prompt || DEFAULT_CHATBOT_SYSTEM_PROMPT,
      chatbot_enabled: res.data?.chatbot_enabled ?? '1',
      n8n_lead_webhook_url: res.data?.n8n_lead_webhook_url || '',
      crm_lead_endpoint: res.data?.crm_lead_endpoint || '',
      blog_permalink_mode: res.data?.blog_permalink_mode || 'date',
      cta_quotes_json: res.data?.cta_quotes_json || '',
      bank_partners_json: res.data?.bank_partners_json || '',
      og_image: res.data?.og_image || '',
    }
    try {
      ctaQuotes.value = JSON.parse(settingsForm.value.cta_quotes_json || '[]')
    } catch {
      ctaQuotes.value = []
    }
    try {
      bankPartnersForm.value = JSON.parse(settingsForm.value.bank_partners_json || '[]')
    } catch {
      bankPartnersForm.value = []
    }
    heroAutoplaySeconds.value = Number(settingsForm.value.hero_autoplay_seconds) || 4.5
  } catch {
    ElMessage.error('Error al cargar configuración')
  } finally {
    loadingSettings.value = false
  }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    settingsForm.value.cta_quotes_json = JSON.stringify(ctaQuotes.value.filter((q) => q.title && q.text))
    settingsForm.value.bank_partners_json = JSON.stringify(bankPartnersForm.value.filter((b) => b.name))
    await adminFetch('/api/settings-admin', {
      method: 'POST',
      body: {
        action: 'save',
        settings: settingsForm.value,
      },
    })
    ElMessage.success('Configuración guardada')
  } catch {
    ElMessage.error('Error al guardar configuración')
  } finally {
    savingSettings.value = false
  }
}

function openPost(post) {
  editingPost.value = post
    ? { ...post, product_id: post.product_id || null, published: !!post.published, external_url: post.external_url || '' }
    : emptyPost()
  editorTab.value = 'es'
  postEditorOpen.value = true
}

async function openAssetBrowser(target, initialDir = '/images', mediaType = 'image') {
  assetTarget.value = target
  assetMediaType.value = mediaType
  assetBrowserOpen.value = true
  await loadAssets(initialDir)
}

async function loadAssets(dir = '/images') {
  try {
    const res = await adminFetch(`/api/admin/assets?dir=${encodeURIComponent(dir)}&type=${assetMediaType.value}`)
    assetDirectory.value = res.currentDir
    assetParentDirectory.value = res.parentDir
    assetDirectories.value = res.directories || []
    assetFiles.value = res.files || []
  } catch {
    ElMessage.error('No se pudo abrir el directorio')
  }
}

function applyAsset(path) {
  if (assetTarget.value === 'post') editingPost.value.image = path
  if (assetTarget.value === 'product') editingProduct.value.image = path
  if (assetTarget.value === 'slider') editingSliderProduct.value.image = path
  if (assetTarget.value === 'hero') editingHeroSlide.value.image = path
  if (assetTarget.value === 'hero-video') editingHeroSlide.value.video = path
  if (assetTarget.value === 'hero-video-en') editingHeroSlide.value.video_en = path
  if (assetTarget.value.startsWith('bank-logo-')) {
    const index = Number(assetTarget.value.replace('bank-logo-', ''))
    if (bankPartnersForm.value[index]) {
      const base = 'https://apiuploads.sigurban.com/storage-api'
      bankPartnersForm.value[index].logo = path.startsWith('http') ? path : base + path
    }
  }
  if (assetTarget.value === 'og-image') {
    const base = 'https://apiuploads.sigurban.com/storage-api'
    settingsForm.value.og_image = path.startsWith('http') ? path : base + path
  }
}

function selectAsset(path) {
  applyAsset(path)
  assetBrowserOpen.value = false
}

function triggerAssetUpload() {
  assetUploadRef.value?.click()
}

async function handleAssetUpload(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  assetUploading.value = true
  try {
    const path = await uploadMediaFile(file, assetDirectory.value || '/images', (pct) => {
      assetUploadProgress.value = pct
    })
    applyAsset(path)
    await loadAssets(assetDirectory.value)
    ElMessage.success(assetMediaType.value === 'video' ? 'Video subido correctamente' : 'Imagen subida correctamente')
  } catch (err) {
    ElMessage.error(err?.message || (assetMediaType.value === 'video' ? 'No se pudo subir el video' : 'No se pudo subir la imagen'))
  } finally {
    assetUploading.value = false
    assetUploadProgress.value = 0
    if (event.target) event.target.value = ''
  }
}

async function loadMedia(dir = '/images') {
  mediaLoading.value = true
  mediaPage.value = 1
  mediaSearch.value = ''
  try {
    const res = await adminFetch(`/api/admin/assets?dir=${encodeURIComponent(dir)}`)
    mediaDirectory.value = res.currentDir ?? dir
    mediaDirectories.value = res.directories ?? []
    mediaFiles.value = res.files ?? []
  } catch {
    ElMessage.error('No se pudo cargar el directorio')
  } finally {
    mediaLoading.value = false
  }
}

function selectMediaCard(file) {
  mediaSelected.value = file
  const url = file.url || file.path
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      mediaCopyToast.value = true
      setTimeout(() => { mediaCopyToast.value = false }, 2500)
    })
  } else {
    ElMessage.info('URL: ' + url)
  }
}

function triggerMediaUpload() {
  mediaUploadRef.value?.click()
}

async function handleMediaUpload(event) {
  const files = [...(event.target?.files || [])]
  if (!files.length) return

  mediaUploading.value = true
  let uploaded = 0
  try {
    for (const [index, file] of files.entries()) {
      mediaUploadFileLabel.value = files.length > 1 ? `${file.name} (${index + 1}/${files.length})` : file.name
      mediaUploadProgress.value = 0
      try {
        await uploadMediaFile(file, mediaDirectory.value || '/images', (pct) => {
          mediaUploadProgress.value = pct
        })
        uploaded++
      } catch (err) {
        ElMessage.error(err.message)
      }
    }
    if (uploaded) {
      ElMessage.success(uploaded === 1 ? 'Archivo subido' : `${uploaded} archivos subidos`)
      await loadMedia(mediaDirectory.value)
    }
  } finally {
    mediaUploading.value = false
    mediaUploadProgress.value = 0
    mediaUploadFileLabel.value = ''
    if (event.target) event.target.value = ''
  }
}

async function confirmDeleteMedia(file) {
  if (!confirm(`¿Eliminar "${file.name}"? Esta acción no se puede deshacer.`)) return
  try {
    await adminFetch('/api/admin/delete-image', {
      method: 'POST',
      body: { dir: mediaDirectory.value, name: file.name },
    })
    ElMessage.success('Archivo eliminado')
    if (mediaSelected.value?.path === file.path) mediaSelected.value = null
    await loadMedia(mediaDirectory.value)
  } catch {
    ElMessage.error('No se pudo eliminar el archivo')
  }
}

async function savePost() {
  savingPost.value = true
  try {
    const action = editingPost.value.id ? 'update' : 'create'
    await adminFetch('/api/blog-admin', { method: 'POST', body: { action, post: editingPost.value } })
    ElMessage.success('Post guardado')
    postEditorOpen.value = false
    await loadBlog()
  } catch {
    ElMessage.error('Error al guardar el post')
  } finally {
    savingPost.value = false
  }
}

async function deletePost(id) {
  if (!confirm('¿Eliminar este post?')) return
  try {
    await adminFetch('/api/blog-admin', { method: 'POST', body: { action: 'delete', post: { id } } })
    ElMessage.success('Post eliminado')
    await loadBlog()
  } catch {
    ElMessage.error('Error al eliminar')
  }
}

function openProduct(product) {
  editingProduct.value = product ? { ...product, is_active: !!product.is_active } : emptyProduct()
  productEditorOpen.value = true
}

async function saveProduct() {
  savingProduct.value = true
  try {
    const action = editingProduct.value.id ? 'update' : 'create'
    await adminFetch('/api/products-admin', { method: 'POST', body: { action, product: editingProduct.value } })
    ElMessage.success('Producto guardado')
    productEditorOpen.value = false
    await loadProducts()
  } catch {
    ElMessage.error('Error al guardar producto')
  } finally {
    savingProduct.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return
  try {
    await adminFetch('/api/products-admin', { method: 'POST', body: { action: 'delete', product: { id } } })
    ElMessage.success('Producto eliminado')
    await loadProducts()
  } catch {
    ElMessage.error('Error al eliminar producto')
  }
}

function openSliderProduct(product) {
  editingSliderProduct.value = product ? { ...emptySliderProduct(), ...product, is_active: !!product.is_active } : emptySliderProduct()
  sliderProductEditorOpen.value = true
}

async function saveSliderProduct() {
  savingSliderProduct.value = true
  try {
    const action = editingSliderProduct.value.id ? 'update' : 'create'
    await adminFetch('/api/slider-products-admin', { method: 'POST', body: { action, product: editingSliderProduct.value } })
    ElMessage.success('Item del slider guardado')
    sliderProductEditorOpen.value = false
    await loadSliderProducts()
  } catch {
    ElMessage.error('Error al guardar item del slider')
  } finally {
    savingSliderProduct.value = false
  }
}

async function deleteSliderProduct(id) {
  if (!confirm('¿Eliminar este item del slider?')) return
  try {
    await adminFetch('/api/slider-products-admin', { method: 'POST', body: { action: 'delete', product: { id } } })
    ElMessage.success('Item del slider eliminado')
    await loadSliderProducts()
  } catch {
    ElMessage.error('Error al eliminar item del slider')
  }
}

function openHeroSlide(slide) {
  editingHeroSlide.value = slide
    ? { ...emptyHeroSlide(), ...slide, has_baked_text: !!slide.has_baked_text, is_active: !!slide.is_active }
    : emptyHeroSlide()
  heroSlideEditorOpen.value = true
}

async function saveHeroSlide() {
  savingHeroSlide.value = true
  try {
    const action = editingHeroSlide.value.id ? 'update' : 'create'
    await adminFetch('/api/hero-slides-admin', { method: 'POST', body: { action, slide: editingHeroSlide.value } })
    ElMessage.success('Slide guardado')
    heroSlideEditorOpen.value = false
    await loadHeroSlides()
  } catch {
    ElMessage.error('Error al guardar el slide')
  } finally {
    savingHeroSlide.value = false
  }
}

async function deleteHeroSlide(id) {
  if (!confirm('¿Eliminar este slide?')) return
  try {
    await adminFetch('/api/hero-slides-admin', { method: 'POST', body: { action: 'delete', slide: { id } } })
    ElMessage.success('Slide eliminado')
    await loadHeroSlides()
  } catch {
    ElMessage.error('Error al eliminar el slide')
  }
}

async function saveHeroAutoplay() {
  savingHeroAutoplay.value = true
  try {
    await adminFetch('/api/settings-admin', {
      method: 'POST',
      body: {
        action: 'save',
        settings: { ...settingsForm.value, hero_autoplay_seconds: String(heroAutoplaySeconds.value) },
      },
    })
    settingsForm.value.hero_autoplay_seconds = String(heroAutoplaySeconds.value)
    ElMessage.success('Duración guardada')
  } catch {
    ElMessage.error('No se pudo guardar la duración')
  } finally {
    savingHeroAutoplay.value = false
  }
}

function openHeroPreview(slide) {
  heroPreviewSlide.value = slide
  heroPreviewOpen.value = true
}

function onHeroDragStart(index) {
  heroDragIndex = index
}

async function onHeroDrop(targetIndex) {
  if (heroDragIndex === null || heroDragIndex === targetIndex) return
  const reordered = [...heroSlides.value]
  const [moved] = reordered.splice(heroDragIndex, 1)
  reordered.splice(targetIndex, 0, moved)
  heroDragIndex = null
  heroSlides.value = reordered.map((slide, index) => ({ ...slide, sort_order: index }))

  try {
    await adminFetch('/api/hero-slides-admin', {
      method: 'POST',
      body: { action: 'reorder', order: reordered.map((slide) => slide.id) },
    })
  } catch {
    ElMessage.error('No se pudo guardar el nuevo orden')
    await loadHeroSlides()
  }
}

function isVideoFile(file) {
  return /^video\//.test(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)
}

// fetch() no expone progreso de subida — XHR sí, vía el evento upload.onprogress.
function xhrUpload(url, formData, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    for (const [key, value] of Object.entries(headers || {})) {
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let payload = null
      try { payload = JSON.parse(xhr.responseText) } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && payload?.ok) resolve(payload)
      else reject(new Error(payload?.statusMessage || payload?.error || `Error al subir (HTTP ${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Error de red al subir'))
    xhr.send(formData)
  })
}

async function uploadViaNuxtProxy(file, dir, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('targetDir', dir)
  const payload = await xhrUpload('/api/admin/upload-image', formData, { 'x-admin-token': auth.value.token }, onProgress)
  return payload.url || payload.path
}

// Sube imagen o video. El video se manda directo a cPanel desde el navegador
// para evitar el límite de ~4.5 MB por request de las Vercel Functions.
async function uploadMediaFile(file, dir, onProgress) {
  const isVideo = isVideoFile(file)
  const maxBytes = isVideo ? 120 * 1024 * 1024 : 4 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`${file.name}: supera el límite de ${isVideo ? '120 MB' : '4 MB'}`)
  }

  if (!isVideo) {
    return uploadViaNuxtProxy(file, dir, onProgress)
  }

  const target = await adminFetch('/api/admin/video-upload-target')
  if (target?.enabled) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const payload = await xhrUpload(`${target.url}?action=upload&dir=${encodeURIComponent(dir)}`, formData, { 'X-Api-Key': target.key }, onProgress)
      return target.baseUrl ? `${target.baseUrl}${payload.path}` : payload.path
    } catch (directErr) {
      console.warn('[media] Falló subida directa a storage, probando proxy Nuxt:', directErr)
      onProgress?.(0)
    }
  }

  return uploadViaNuxtProxy(file, dir, onProgress)
}

function triggerHeroVideoUpload(target) {
  heroVideoUploadTarget.value = target
  heroVideoUploadRef.value?.click()
}

async function handleHeroVideoUpload(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const target = heroVideoUploadTarget.value
  heroVideoUploading.value = true
  heroVideoUploadProgress.value = 0
  try {
    editingHeroSlide.value[target] = await uploadMediaFile(file, '/images/videos', (pct) => {
      heroVideoUploadProgress.value = pct
    })
    ElMessage.success('Video subido correctamente')
  } catch (err) {
    ElMessage.error('No se pudo subir el video: ' + (err?.message || ''))
  } finally {
    heroVideoUploading.value = false
    heroVideoUploadProgress.value = 0
    if (event.target) event.target.value = ''
  }
}

function openUser(user) {
  editingUser.value = user ? { ...user, password: '' } : emptyUser()
  userEditorOpen.value = true
}

async function saveUser() {
  savingUser.value = true
  try {
    const action = editingUser.value.id ? 'update' : 'create'
    await adminFetch('/api/admin/users', { method: 'POST', body: { action, user: editingUser.value } })
    ElMessage.success('Usuario guardado')
    userEditorOpen.value = false
    await loadUsers()
  } catch {
    ElMessage.error('Error al guardar usuario')
  } finally {
    savingUser.value = false
  }
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return
  try {
    await adminFetch('/api/admin/users', { method: 'POST', body: { action: 'delete', user: { id } } })
    ElMessage.success('Usuario eliminado')
    await loadUsers()
  } catch {
    ElMessage.error('Error al eliminar usuario')
  }
}

function buildExcerpt(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(async () => {
  restoreAuth()
  if (auth.value.token) {
    await bootAdmin()
    if (tab.value === 'multimedia') await loadMedia('/images')
    if (!location.hash) history.replaceState(null, '', `#${tab.value}`)
  }
  window.addEventListener('hashchange', handleHashChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<style scoped>
.admin-wrap {
  min-height: 100vh;
  background: #f4f6fa;
  font-family: 'Montserrat', sans-serif;
}

.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #17324b 0%, #203325 100%);
}

.login-card {
  width: 360px;
  padding: 40px 34px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}

.login-logo {
  height: 46px;
  display: block;
  margin: 0 auto 12px;
}

.login-card h1 {
  margin: 0;
  text-align: center;
  color: #17324b;
}

.login-subtitle {
  margin: 8px 0 18px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}

.login-error {
  color: #d93025;
  font-size: 13px;
  margin: 10px 0 0;
}

.admin-panel {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  padding: 24px 16px;
  background: #17324b;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-logo {
  width: 120px;
  height: auto;
  margin-bottom: 4px;
}

.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.cta-quote-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.sidebar-user {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-user strong {
  font-size: 13px;
  word-break: break-word;
}

.sidebar-user span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.75);
}

.nav-item {
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  text-align: left;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  background: #78af2b;
  color: white;
}

.logout-btn {
  margin-top: auto;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: transparent;
  color: white;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
}

.admin-main {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0;
  color: #17324b;
  font-size: 26px;
}

.section-hint {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.empty-state {
  padding: 42px 0;
  color: #6b7280;
  text-align: center;
}

.submissions-list,
.blog-list,
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submission-card,
.blog-row,
.user-row {
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.sub-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eef1f4;
}

.sub-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 20px;
  background: #e2e8f0;
  color: #475569;
}
.type-distributor { background: #fef9c3; color: #854d0e; }
.type-contact     { background: #dcfce7; color: #166534; }
.type-email       { background: #dbeafe; color: #1e40af; }

.sub-date { font-size: 12px; color: #94a3b8; }

.sub-message { white-space: pre-wrap; }

/* ── Submission detail modal ── */
.sub-detail { display: flex; flex-direction: column; gap: 0; }

.sub-detail-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  align-items: start;
}
.sub-detail-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sub-detail-value {
  font-size: 14px;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
}
.sub-detail-sep {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

/* ── Submissions toolbar, checkboxes, pagination ── */
.subs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.subs-check-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  user-select: none;
}

.subs-check-all input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #17324b;
  cursor: pointer;
}

.subs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subs-selected-count {
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
}

.sub-checkbox {
  display: flex;
  align-items: center;
}

.sub-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #17324b;
  cursor: pointer;
}

.submission-card.is-selected {
  outline: 2px solid #17324b;
  outline-offset: -2px;
  background: #f0f4f8;
}

.subs-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.subs-page-info {
  font-size: 14px;
  color: #64748b;
  min-width: 60px;
  text-align: center;
}

.blog-row,
.user-row {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.blog-row-img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #eef2f7;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-row-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-no-img {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
}

.blog-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.blog-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
}

.pub-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 3px 8px;
}

.pub-badge.pub {
  background: #dff6dd;
  color: #1f7a35;
}

.pub-badge.draft {
  background: #f2f4f7;
  color: #6b7280;
}

.blog-row-actions,
.product-actions {
  display: flex;
  gap: 8px;
}

.post-editor,
.editor-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.editor-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.slider-section-divider {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #78af2b;
  border-top: 1px solid #e8f0de;
  padding-top: 12px;
  margin-top: 4px;
}

.hero-autoplay-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.hero-autoplay-row label {
  font-size: 13px;
  font-weight: 700;
  color: #17324b;
}

.hero-autoplay-row span {
  font-size: 13px;
  color: #6b7280;
}

.upload-progress {
  margin-top: 10px;
}

.upload-progress-bar {
  height: 6px;
  border-radius: 999px;
  background: #e8f0de;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: #78af2b;
  transition: width 0.15s ease;
}

.upload-progress-label {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
}

.product-card[draggable="true"] {
  cursor: grab;
}

.editor-grid label,
.editor-stack label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #17324b;
}

.image-field {
  display: flex;
  gap: 10px;
  align-items: center;
}

.image-preview-thumb {
  margin-top: 10px;
  width: 100%;
  max-width: 220px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #d9e3d0;
  background: #f8fbf4;
}

.image-preview-thumb.product {
  object-fit: contain;
  padding: 10px;
}

.publish-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.seo-note {
  color: #6b7280;
  font-size: 12px;
}

.seo-preview {
  background: #f8fbf4;
  border: 1px solid #dce8cf;
  border-radius: 12px;
  padding: 14px 16px;
}

.seo-preview strong {
  display: block;
  margin-bottom: 10px;
  color: #203325;
}

.seo-preview p {
  margin: 6px 0;
  font-size: 13px;
  color: #475467;
}

.seo-preview span {
  font-weight: 700;
  color: #17324b;
}

.settings-stack {
  max-width: 920px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.product-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-preview {
  height: 180px;
  border-radius: 12px;
  background: #f8fbf4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.product-preview img,
.product-preview video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.product-info strong {
  color: #17324b;
  font-size: 15px;
}

.user-row {
  justify-content: space-between;
}

.user-row strong {
  display: block;
  color: #17324b;
}

.user-row span {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.asset-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.asset-path {
  font-size: 13px;
  font-weight: 700;
  color: #17324b;
  word-break: break-all;
}

.asset-toolbar-actions {
  display: flex;
  gap: 10px;
}

.asset-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 18px;
}

.asset-layout h3 {
  margin: 0 0 10px;
  color: #17324b;
  font-size: 14px;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-entry {
  border: 1px solid #dbe6d0;
  background: #f8fbf4;
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  color: #17324b;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.asset-card {
  border: 1px solid #dbe6d0;
  background: white;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.asset-card img,
.asset-card video {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  background: #f5f7f9;
}

.asset-card span,
.asset-empty {
  font-size: 12px;
  color: #475467;
  word-break: break-word;
}

.media-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  font-size: 13px;
}
.crumb-btn {
  background: none;
  border: none;
  color: #4d8b31;
  cursor: pointer;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
}
.crumb-btn:hover { background: #f0f7eb; }
.crumb-sep { color: #aaa; }
.crumb-segment { display: inline-flex; align-items: center; gap: 4px; }

.media-folders {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.media-folder-btn {
  background: #f8fbf4;
  border: 1px solid #dbe6d0;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #17324b;
  font-weight: 500;
  transition: background 0.15s;
}
.media-folder-btn:hover { background: #e8f5e0; }

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.media-card {
  border: 2px solid #e8ecef;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.media-card:hover { border-color: #7db251; box-shadow: 0 2px 10px rgba(125,178,81,0.15); }
.media-card-selected { border-color: #4d8b31; box-shadow: 0 0 0 3px rgba(77,139,49,0.2); }
.media-thumb-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7f9;
}
.media-thumb-wrap img,
.media-thumb-wrap video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}
.media-thumb-wrap:hover img,
.media-thumb-wrap:hover video { transform: scale(1.04); }
.media-video-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.55);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
  line-height: 1.4;
}
.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.media-thumb-wrap:hover .media-overlay { opacity: 1; }
.media-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  gap: 4px;
}
.media-filename {
  font-size: 11px;
  color: #475467;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.media-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.media-delete-btn:hover { opacity: 1; background: #fff0f0; }

.media-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}
.media-page-info { font-size: 13px; color: #6b7280; }
.media-count { font-size: 13px; color: #6b7280; text-align: right; padding: 8px 0; }

.media-copy-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #17324b;
  color: white;
  padding: 10px 22px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.copy-toast-enter-active, .copy-toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.copy-toast-enter-from, .copy-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

@media (max-width: 900px) {
  .admin-panel {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .image-field,
  .asset-toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .asset-layout {
    grid-template-columns: 1fr;
  }
}
</style>
